import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

const ShowAlbum = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:4000/album/${id}`)
      .then((res) => setAlbum(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = () => {
    axios
      .delete(`http://localhost:4000/album/${id}`)
      .then(() => navigate("/"))
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="container">
        <div className="row justify-content-center align-items-center g-2">
          <div className="col">
            <div className="card">
              <img className="card-img-top" src={album.imageUrl} alt="Title" />

              <div className="card-body">
                <h4 className="card-title">{album.albumName}</h4>

                <p className="card-text">{album.genre}</p>
                <p className="card-text">{album.artist}</p>
                <p className="card-text">{album.year}</p>

                <NavLink
                  className="btn btn-warning mx-2"
                  to={`/edit/${id}`}
                  role="button"
                >
                  Edit Album
                </NavLink>

                <button
                  type="button"
                  className="btn btn-danger mx-2"
                  onClick={handleDelete}
                >
                  Delete
                </button>

                <NavLink
                  className="btn btn-secondary mx-2"
                  to="/"
                  role="button"
                >
                  Back
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowAlbum;
