import { AssistantMessageStatus, MessageBlock, MessageBlockStatus, MessageBlockType } from '@/types/message'

import { messageBlockDatabase, messageDatabase } from '@database'
import { loggerService } from '../LoggerService'

const logger = loggerService.withContext('Block Manager')

interface ActiveBlockInfo {
  id: string
  type: MessageBlockType
}

interface BlockManagerDependencies {
  saveUpdatedBlockToDB: (
    blockId: string | null,
    messageId: string,
    topicId: string,
    blockSnapshot?: MessageBlock | null
  ) => Promise<void>
  saveUpdatesToDB: (
    messageId: string,
    topicId: string,
    messageUpdates: Partial<any>,
    blocksToUpdate: MessageBlock[]
  ) => Promise<void>
  assistantMsgId: string
  topicId: string
  // 节流器管理从外部传入
  throttledBlockUpdate: (id: string, blockUpdate: Partial<MessageBlock>) => Promise<void>
  cancelThrottledBlockUpdate: (id: string) => Promise<void>
}

export class BlockManager {
  private deps: BlockManagerDependencies

  // 简化后的状态管理
  private _activeBlockInfo: ActiveBlockInfo | null = null
  private _lastBlockType: MessageBlockType | null = null // 保留用于错误处理
  private blockCache = new Map<string, MessageBlock>()

  constructor(dependencies: BlockManagerDependencies) {
    this.deps = dependencies
  }

  // Getters
  get activeBlockInfo() {
    return this._activeBlockInfo
  }

  get lastBlockType() {
    return this._lastBlockType
  }

  get hasInitialPlaceholder() {
    return this._activeBlockInfo?.type === MessageBlockType.UNKNOWN
  }

  get initialPlaceholderBlockId() {
    return this.hasInitialPlaceholder ? this._activeBlockInfo?.id || null : null
  }

  // Setters
  set lastBlockType(value: MessageBlockType | null) {
    this._lastBlockType = value
  }

  set activeBlockInfo(value: ActiveBlockInfo | null) {
    this._activeBlockInfo = value
  }

  private async mergeBlockChanges(blockId: string, changes: Partial<MessageBlock>): Promise<MessageBlock | null> {
    const existing = this.blockCache.get(blockId) ?? (await messageBlockDatabase.getBlockById(blockId))

    if (!existing) {
      logger.warn(`[BlockCache] Block ${blockId} not found when applying changes.`)
      return null
    }

    const merged = {
      ...existing,
      ...changes,
      id: existing.id,
      messageId: existing.messageId,
      updatedAt: changes.updatedAt ?? Date.now()
    } as MessageBlock

    this.blockCache.set(blockId, merged)
    return merged
  }

  /**
   * 智能更新策略：根据块类型连续性自动判断使用节流还是立即更新
   */
  async smartBlockUpdate(
    blockId: string,
    changes: Partial<MessageBlock>,
    blockType: MessageBlockType,
    isComplete: boolean = false
  ) {
    const isBlockTypeChanged = this._lastBlockType !== null && this._lastBlockType !== blockType

    const enrichedChanges: Partial<MessageBlock> = {
      ...changes,
      updatedAt: changes.updatedAt ?? Date.now()
    }

    const blockSnapshot = await this.mergeBlockChanges(blockId, enrichedChanges)

    if (isBlockTypeChanged || isComplete) {
      // 如果块类型改变，则取消上一个块的节流更新
      if (isBlockTypeChanged && this._activeBlockInfo) {
        await this.deps.cancelThrottledBlockUpdate(this._activeBlockInfo.id)
      }

      // 如果当前块完成，则取消当前块的节流更新
      if (isComplete) {
        await this.deps.cancelThrottledBlockUpdate(blockId)
        this._activeBlockInfo = null // 块完成时清空activeBlockInfo
      } else {
        this._activeBlockInfo = { id: blockId, type: blockType } // 更新活跃块信息
      }

      await messageBlockDatabase.updateOneBlock({ id: blockId, changes: enrichedChanges })
      await this.deps.saveUpdatedBlockToDB(blockId, this.deps.assistantMsgId, this.deps.topicId, blockSnapshot)
      this._lastBlockType = blockType
    } else {
      this._activeBlockInfo = { id: blockId, type: blockType } // 更新活跃块信息
      await this.deps.throttledBlockUpdate(blockId, enrichedChanges)
    }
  }

  /**
   * 处理块转换
   */
  async handleBlockTransition(newBlock: MessageBlock, newBlockType: MessageBlockType) {
    logger.info('handleBlockTransition', newBlock, newBlockType)
    this._lastBlockType = newBlockType
    this._activeBlockInfo = { id: newBlock.id, type: newBlockType } // 设置新的活跃块信息
    this.blockCache.set(newBlock.id, newBlock)

    await messageBlockDatabase.upsertBlocks(newBlock)
    // change message status
    const toBeUpdatedMessage = await messageDatabase.getMessageById(newBlock.messageId)

    if (!toBeUpdatedMessage) {
      logger.error(`[upsertBlockReference] Message ${newBlock.messageId} not found.`)
      return
    }

    // Update Message Status based on Block Status
    if (newBlock.status === MessageBlockStatus.ERROR) {
      toBeUpdatedMessage.status = AssistantMessageStatus.ERROR
    } else if (
      newBlock.status === MessageBlockStatus.SUCCESS &&
      toBeUpdatedMessage.status !== AssistantMessageStatus.PROCESSING &&
      toBeUpdatedMessage.status !== AssistantMessageStatus.SUCCESS &&
      toBeUpdatedMessage.status !== AssistantMessageStatus.ERROR
    ) {
      toBeUpdatedMessage.status = AssistantMessageStatus.SUCCESS
    } else if (newBlock.status === MessageBlockStatus.PROCESSING || newBlock.status === MessageBlockStatus.STREAMING) {
      toBeUpdatedMessage.status = AssistantMessageStatus.PROCESSING
    }

    const updatedMessage = await messageDatabase.upsertMessages(toBeUpdatedMessage)

    if (!updatedMessage) {
      logger.error(`[handleBlockTransition] Failed to update message ${toBeUpdatedMessage.id} in state.`)
      return
    }
  }
}
