import React, { useState, useEffect } from "react";
import { getData } from "../utils/axios";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function View_file() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getData(`/html/categories`);
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }
    try {
      const result = await getData(
        `/html/files/${encodeURIComponent(searchTerm)}`
      );
      setSearchResults(result);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        onClick={() => {
          setSearchResults([]);
        }}
        className="backdrop"
        style={searchResults.length > 1 ? { zIndex: 99 } : { zIndex: -1 }}
      ></div>
      <div
        style={{
          height: 50,
          backgroundColor: "#fff",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 style={{ paddingLeft: 10 }}>welcome</h3>
        <div
          style={{ display: "flex", alignItems: "center", paddingRight: 20 }}
        >
          <input
            type="text"
            placeholder="search"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              height: 30,
              width: 200,
              borderRadius: 5,
              border: "1px solid gray",
              paddingLeft: 10,
            }}
          />
          <button onClick={handleSearch} className="search-btn">
            Search
          </button>
          <div
            className="list-container"
            style={
              searchResults.length > 0
                ? { zIndex: 100, height: 200 }
                : { zIndex: -1, height: 0 }
            }
          >
            {searchResults.length > 0 && (
              <ul className="list">
                {searchResults.map((item, index) => (
                  <li key={index} className="list-item">
                    <a
                      href={`${axios.defaults.baseURL}/html/categories/${item}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <a
          href="https://www.techtt.site/html/static/add.html"
          style={{
            textDecoration: "none",
            fontSize: 15,
            color: "black",
            paddingRight: 10,
            backgroundColor: "lightblue",
            padding: 5,
            marginRight: 10,
            borderRadius: 5,
          }}
        >
          Upload.
        </a>
      </div>
      <div className="row-container" style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '10px' }}>
        {data?.allCategories?.map((item, index) => (
          <button
            key={index}
            className="card"
            onClick={() => {
              navigate(`/three/html/view/category/${item}`);
            }}
          >
            <h4 className="card-title">{item}</h4>
          </button>
        ))}
      </div>
    </div>
  );
}

export default View_file;
