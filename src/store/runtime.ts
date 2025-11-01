import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface RuntimeState {
  htmlPreviewContent: string | null
}

const initialState: RuntimeState = {
  htmlPreviewContent: null
}

const runtimeSlice = createSlice({
  name: 'runtime',
  initialState,
  reducers: {
    setHtmlPreviewContent(state, action: PayloadAction<string | null>) {
      state.htmlPreviewContent = action.payload
    }
  }
})

export const { setHtmlPreviewContent } = runtimeSlice.actions

export default runtimeSlice.reducer
