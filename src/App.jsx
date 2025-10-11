import React from 'react'
import Home from './express_view/home'
import axios from "axios";
import HomeChat from './real_Time/chat/home';

axios.defaults.baseURL = "https://www.techtt.site"; //for server
// axios.defaults.baseURL="http://localhost:8000"

function App() {
  return (
    <div style={{backgroundColor:"#eaea"}}>
        {/* <Home/> */}
        <HomeChat/>
    </div>
  )
}

export default App
