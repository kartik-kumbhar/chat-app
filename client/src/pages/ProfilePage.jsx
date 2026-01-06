import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [loading, setLoading] = useState(false);

  if (!authUser)
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        Loading profile...
      </div>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Name cannot be empty");
    if (!bio.trim()) return toast.error("Bio cannot be empty");

    try {
      setLoading(true);

      // If image is not changed → update normally
      if (!selectedImg) {
        await updateProfile({ fullName: name, bio });
        toast.success("Profile updated");
        navigate("/");
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImg);

      reader.onload = async () => {
        const base64Image = reader.result;
        await updateProfile({
          profilepic: base64Image,
          fullName: name,
          bio,
        });

        toast.success("Profile updated");
        navigate("/");
      };
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        {/* -------- LEFT FORM -------- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
          <h3 className="text-lg">Profile Details</h3>

          {/* Upload Image */}
          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />

            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilepic || assets.avatar_icon
              }
              alt=""
              className="w-12 h-12 rounded-full"
            />

            Upload Profile Image
          </label>

          {/* Name */}
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          {/* Bio */}
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>

        {/* -------- RIGHT PROFILE PREVIEW -------- */}
        <img
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10"
          src={
            selectedImg
              ? URL.createObjectURL(selectedImg)
              : authUser?.profilepic || assets.logo_icon
          }
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfilePage;
