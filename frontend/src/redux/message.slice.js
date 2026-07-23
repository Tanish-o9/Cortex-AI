import { createSlice } from '@reduxjs/toolkit'


const initialState = {
   messages:[],
   isLoading:false,
   artifacts:[]
}

export const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages:(state,action)=>{

   state.messages =action.payload;

  },

  addMessage:(state,action)=>{

   state.messages.push(action.payload);

  },
   appendMessageChunk:(state,action)=>{
     const last = state.messages[state.messages.length - 1];
     if (last && last.role === "assistant") {
       last.content += action.payload;
     }
   },
   setIsLoading:(state,action)=>{

   state.isLoading=action.payload;

  },
  setArtifacts: (state, action) => {
  state.artifacts = action.payload;
}
 
  },
})

// Action creators are generated for each case reducer function
export const {setMessages,addMessage,appendMessageChunk,setIsLoading,setArtifacts} = messageSlice.actions

export default messageSlice.reducer