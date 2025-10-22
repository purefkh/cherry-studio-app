import { sql } from 'drizzle-orm'

/**
 * 动态构建 excluded 字段映射，用于批量 upsert 操作
 * @description 将数据库记录的所有字段（除指定排除字段外）映射为 `excluded.field_name` 引用
 * @param sample - 示例记录对象，用于获取字段列表
 * @param excludeKeys - 需要排除的字段列表，默认排除 'id'
 * @returns 字段到 excluded 引用的映射对象
 * @example
 * ```typescript
 * const dbRecords = [{ id: '1', name: 'foo', age: 20 }]
 * const updateFields = buildExcludedSet(dbRecords[0])
 * // 返回: { name: sql`excluded.name`, age: sql`excluded.age` }
 * ```
 */
export function buildExcludedSet<T extends Record<string, any>>(
  sample: T,
  excludeKeys: string[] = ['id']
): Record<string, any> {
  return Object.keys(sample).reduce(
    (acc, key) => {
      if (!excludeKeys.includes(key)) {
        acc[key] = sql.raw(`excluded."${key}"`)
      }
      return acc
    },
    {} as Record<string, any>
  )
}
