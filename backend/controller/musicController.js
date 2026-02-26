const musicModel = require("../model/musicModel");
const addAlbum = async (req, res) => {
  try {
    const result = await musicModel.create(req.body);
    res.status(201).json({
      message: "Album Added Successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Adding Album",
      error: error.message,
    });
  }
};

const editAlbum = async (req, res) => {
  try {
    const result = await musicModel.findByIdAndUpdate(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ message: "Album Not Found" });
    }
    res.status(200).json({
      message: "Album Updated Successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Updating Album",
      error: error.message,
    });
  }
};

const deleteAlbum = async (req, res) => {
  try {
    const result = await musicModel.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Album Not Found" });
    }
    res.status(200).json({
      message: "Album Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Deleting Album",
    });
  }
};
const showAlbum = async (req, res) => {
  try {
    const result = await musicModel.find();
    res.status(200).json({
      message: "All Albums",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Fetching Albums",
    });
  }
};

const getSingleAlbum = async (req, res) => {
  try {
    const result = await musicModel.findById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error Fetching Album" });
  }
};

module.exports = { addAlbum, showAlbum, editAlbum, deleteAlbum,getSingleAlbum };
