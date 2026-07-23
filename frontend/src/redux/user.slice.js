import { createSlice } from '@reduxjs/toolkit'
import { act } from 'react'

const initialState = {
  userData:null,
  currentView: "chat" // chat, workflows, marketplace, knowledge, dashboard, playground
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData:(state,action)=>{
        state.userData=action.payload
    },
    setCurrentView:(state,action)=>{
        state.currentView=action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const {setUserData, setCurrentView} = userSlice.actions

export default userSlice.reducer