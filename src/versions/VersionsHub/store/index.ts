import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterReducer";

export default configureStore({
  reducer: {
    counter: counterReducer,
  },
});
