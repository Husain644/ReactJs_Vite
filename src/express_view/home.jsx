import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import View_file from "./components/pages/view_file.jsx";
import View_sub_file from "./components/pages/view_sub_file.jsx";
import Edit_file from "./components/pages/edit_file.jsx";
import './express.css'


function Home() {
  
  return (
    <Router basename="/html/view">
      <Routes>
        <Route path="/" element={<View_file />} />
        <Route path="/category/:category" element={<View_sub_file />} />
        <Route path="/edit" element={<Edit_file />} />
      </Routes>
    </Router>
  );
}

export default Home;

