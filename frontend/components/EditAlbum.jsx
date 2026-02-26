import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";

const EditAlbum = () => {
  const { id } = useParams();

  const [album, setAlbum] = useState({
    albumName: "",
    imageUrl: "",
    artist: "",
    year: "",
    genre: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:4000/album/${id}`)
      .then((res) => setAlbum(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .put(`http://localhost:4000/album/${id}`, album)
      .then(() => navigate(`/album/${id}`))
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="container">
        <div className="row justify-content-center align-items-center g-2">
          <div className="col">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Edit Album</h4>

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      value={album.albumName}
                      onChange={(e) =>
                        setAlbum({ ...album, albumName: e.target.value })
                      }
                    />
                    <label>Album Name</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      value={album.artist}
                      onChange={(e) =>
                        setAlbum({ ...album, artist: e.target.value })
                      }
                    />
                    <label>Artist</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      value={album.year}
                      onChange={(e) =>
                        setAlbum({ ...album, year: e.target.value })
                      }
                    />
                    <label>Year</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      value={album.genre}
                      onChange={(e) =>
                        setAlbum({ ...album, genre: e.target.value })
                      }
                    />
                    <label>Genre</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      value={album.imageUrl}
                      onChange={(e) =>
                        setAlbum({ ...album, imageUrl: e.target.value })
                      }
                    />
                    <label>Image URL</label>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Edit Album
                  </button>

                  <NavLink
                    className="btn btn-secondary ms-2"
                    to={`/album/${id}`}
                  >
                    Back
                  </NavLink>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAlbum;
