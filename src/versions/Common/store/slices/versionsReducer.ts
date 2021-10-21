import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReleaseDefinition } from "azure-devops-extension-api/Release";
import { getPipelineConfig, setPipelineConfig } from "../../services/dataservice";

interface versionsState {
  pipelines: number[];
  addedValue?: number;
}

export const addPipelineAsync = createAsyncThunk("versions/addPipeline", async (pipelineId: number, thunkAPI) => {
  let pipelines = await getPipelineConfig();

  pipelines = [...new Set([...pipelines, pipelineId])];

  await setPipelineConfig(pipelines);

  return pipelines;
});

// A mock function to mimic making an async request for data
export function fetchCount(amount = 1) {
  return new Promise<{ data: number }>((resolve) => setTimeout(() => resolve({ data: amount }), 500));
}

export const versionsSlice = createSlice({
  name: "versions",
  initialState: {
    pipelines: [],
    value: 0,
  } as versionsState,
  reducers: {
    setPipelines: (state, action: PayloadAction<number[]>) => {
      state.pipelines = action.payload;
    },
    addPipeline: (state, action: PayloadAction<number>) => {
      console.log("pipelines", ...state.pipelines);
      state.pipelines = [...new Set([...state.pipelines, action.payload])];
      console.log("pipelines after state", ...state.pipelines);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(addPipelineAsync.rejected, (state, action) => {
      console.error("Failed to save pipelines information", action.error);
    });
    builder.addCase(addPipelineAsync.fulfilled, (state, action) => {
      console.log("Pipelines saved");
    });
  },
});

export const { setPipelines, addPipeline } = versionsSlice.actions;

export default versionsSlice.reducer;

export const selectAddedValue = (state: versionsState) => state.addedValue;
