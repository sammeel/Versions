import { AnyAction, createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IExtensionDataService } from "azure-devops-extension-api";
import { DispatchForMiddlewares } from "@reduxjs/toolkit/dist/tsHelpers";
import { ThunkAction } from "redux-thunk";
import { RootState } from "..";

interface versionsState {
  pipelines: string[];
  addedValue?: string;
}

export const addPipeline = createAsyncThunk("versions/addPipeline", async (newPipeline: string, thunkAPI) => {
  const accessToken = await SDK.getAccessToken();
  const extensionDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

  const manager = await extensionDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

  let pipelines: string[] = [];
  try {
    pipelines = await manager.getValue<string[]>("pipelines");
  } catch (err) {
    console.log("error setting value", err);
  }

  if (!pipelines) {
    pipelines = [];
  }

  pipelines.push(newPipeline);

  pipelines = [...new Set([...pipelines, newPipeline])]

  await manager.setValue<string[]>("pipelines", pipelines);

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
    value: 0
  } as versionsState,
  reducers: {
    setPipelines: (state, action: PayloadAction<string[]>) => {
      state.pipelines = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(addPipeline.fulfilled, (state, action) => {
      state.pipelines = action.payload;
    });
  },
});

export const { setPipelines } = versionsSlice.actions;

export default versionsSlice.reducer;

export const selectAddedValue = (state: versionsState) => state.addedValue;
