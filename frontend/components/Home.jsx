import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const Home = () => {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/album/")
      .then((res) => setAlbums(res.data.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <div className="container">
        <div className="row justify-content-center align-items-center g-2">
          {albums.map((album) => (
            <div className="col" key={album._id}>
              <div className="card">
                <img
                  className="card-img-top"
                  src={album.imageUrl}
                  alt="Title"
                />

                <div className="card-body">
                  <h4 className="card-title">{album.albumName}</h4>
                  <p className="card-text">{album.genre}</p>
                  <NavLink
                    className="btn btn-primary"
                    to={`/album/${album._id}`}
                    role="button"
                  >
                    Read More
                  </NavLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
