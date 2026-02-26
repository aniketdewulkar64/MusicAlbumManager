import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddAlbum = () => {
  const [album, setAlbum] = useState({
    albumName: "",
    imageUrl: "",
    artist: "",
    year: "",
    genre: "",
  });

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:4000/album/add", album)
      .then(() => navigate("/"))
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="container">
        <div className="row justify-content-center align-items-center g-2">
          <div className="col">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title text-center">Add Album</h4>

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
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
                      onChange={(e) =>
                        setAlbum({ ...album, imageUrl: e.target.value })
                      }
                    />
                    <label>Image URL</label>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Add Album
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAlbum;
