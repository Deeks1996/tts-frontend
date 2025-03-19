import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaFileUpload, FaMicrophone } from "react-icons/fa";
import LogoutButton from '../components/Logout';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://tts-backend-five.vercel.app";

function TTSPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const getUserToken = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setToken(data.session.access_token);
      }
    };
    getUserToken();
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === "text/plain") {
      setFile(uploadedFile);
      setText("");
    } else {
      toast.error('Please upload a valid .txt file.',{position:"top-right",autoClose:2000});
    }
  };

  const handleTTSConversion = async () => {
    if (!text && !file) {
      alert("Please enter text or upload a file");
      return;
    }

    setLoading(true);

    let inputText = text;
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        inputText = event.target.result;
        await processTTS(inputText);
      };
      reader.readAsText(file);
    } else {
      await processTTS(inputText);
    }
  };


  const processTTS = async (inputText) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/tts/convert`, 
        { text: inputText }, 
        {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.audioUrl) {
        setAudioUrl(response.data.audioUrl);
        toast.success("TTS Conversion successfull",{position:"top-right",autoClose:2000});
      } 
      else {
        toast.error("TTS Conversion failed!", { position: "top-right" });
      }
    } catch (error) {
      console.log(error);
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-3 bg-tts">
      <div className="flex flex-row justify-end w-full">
        <LogoutButton/>
      </div>
      
      <h2 className="text-3xl font-bold mb-4 text-gray-200">Text-to-Speech</h2>

      <div className="flex flex-col w-full max-w-lg bg-black p-6 rounded-lg shadow-md space-y-4 border-2 border-gray-200"> 
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows="4"
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFile(null);
          }}
          disabled={file}
        />
        
        <p className="mt-2 text-white text-center"> OR </p>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FaFileUpload className="w-10 h-10 mb-4 text-blue-500 dark:text-gray-400 hover:text-blue-400" />
              <p className="mb-2 text-md text-blue-900 font-bold dark:text-gray-400 hover:text-blue-400">Upload file</p>
              <span className="text-green-500">{file ? file.name : ""}</span>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={text.length > 0}
              accept=".txt"
            />
          </label>
        </div>
{/* 
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="w-full border p-2 mb-2"
          disabled={text.length > 0}
        /> */}

        <div className="flex justify-center">
          <button
            onClick={handleTTSConversion}
            className="px-5 py-2 bg-red-800 text-white font-bold rounded-2xl hover:bg-red-600 transition duration-300"
            disabled={loading}
          >
            {loading ? "Converting..." : "Convert to Speech"}
          </button>
        </div>

        {audioUrl && (
          <div className="mt-8 flex flex-col items-center space-y-4 bg-gray-600 p-5 rounded-2xl border">
            <h2 className="flex flex-row text-xl font-medium text-blue-100">
              <FaMicrophone className="m-1" /> Audio Playback
            </h2>

            <audio controls className="max-w-lg w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default TTSPage;
