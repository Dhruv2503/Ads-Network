import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebaseConfig";
import { ref, deleteObject } from "firebase/storage";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FaTrashAlt, FaUserCircle } from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";
import Moment from "react-moment";
import useSnapshot from "../utils/useSnapshot";
import { toggleFavorite } from "../utils/fav";
import Sold from "../Components/Sold";

const Ad = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ad, setAd] = useState();
  const [idx, setIdx] = useState(0);
  const [seller, setSeller] = useState();
  const [showNumber, setShowNumber] = useState(false);

  const { val } = useSnapshot("favorites", id);

  const getAd = async () => {
    const docRef = doc(db, "ads", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setAd(docSnap.data());

      const sellerRef = doc(db, "users", docSnap.data().postedBy);
      const sellerSnap = await getDoc(sellerRef);

      if (sellerSnap.exists()) {
        setSeller(sellerSnap.data());
      }
    }
  };

  useEffect(() => {
    getAd();
  }, []);

  const deleteAd = async () => {
    const confirm = window.confirm(`Delete ${ad.title}?`);
    if (confirm) {
      // delete images
      for (const image of ad.images) {
        const imgRef = ref(storage, image.path);
        await deleteObject(imgRef);
      }
      // delete fav doc from firestore
      await deleteDoc(doc(db, "favorites", id));
      // delete ad doc from firestore
      await deleteDoc(doc(db, "ads", id));
      // navigate to seller profile
      navigate(`/profile/${auth.currentUser.uid}`);
    }
  };

  const updateStatus = async () => {
    await updateDoc(doc(db, "ads", id), {
      isSold: true,
    });
    getAd();
  };

  const createChatroom=async()=>{
    const loggedInUser=auth.currentUser.uid;
    const chatId=
      loggedInUser>ad.postedBy 
      ? `${loggedInUser}.${ad.postedBy}.${id}`
      : `${ad.postedBy}.${loggedInUser}.${id}`

    await setDoc(doc(db,'messages',chatId),{
      ad:id,
      users:[loggedInUser,ad.postedBy]
    })
    navigate('/chat',{state:{ad}});

  }

  return ad ? (
    <div className="mt-5 container">
      <div className="row">
        <div id="carouselExample" className="carousel slide col-md-8 position-relative">
          {ad.isSold && <Sold singleAd={true} />}
          <div className="carousel-inner">
            {ad.images.map((image, i) => (
              <div
                className={`carousel-item ${idx === i ? "active" : ""}`}
                key={i}
              >
                <img
                  src={image.url}
                  className="d-block w-100"
                  alt={ad.title}
                  style={{ height: "500px" }}
                />

                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#carouselExample"
                  data-bs-slide="prev"
                  onClick={() => setIdx(i)}
                >
                  <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#carouselExample"
                  data-bs-slide="next"
                  onClick={() => setIdx(i)}
                >
                  <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title">
                  RS. {Number(ad.price).toLocaleString()}
                </h5>
                {val?.users?.includes(auth.currentUser?.uid) ? (
                  <AiFillHeart
                    size={30}
                    onClick={() => toggleFavorite(val.users, id)}
                    className="text-danger"
                  />
                ) : (
                  <AiOutlineHeart
                    size={30}
                    onClick={() => toggleFavorite(val.users, id)}
                    className="text-danger"
                  />
                )}
              </div>
              <h6 className="card-subtitle mb-2">{ad.title}</h6>
              <div className="d-flex justify-content-between">
                <p className="card-text">
                  {ad.location} -{" "}
                  <small>
                    <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
                  </small>
                </p>
                {ad.postedBy === auth.currentUser?.uid && (
                  <FaTrashAlt
                    size={20}
                    className="text-danger"
                    onClick={deleteAd}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">Seller Description</h5>
              <Link to={`/profile/${ad.postedBy}`}>
                <div className="d-flex align-items-center">
                  {seller?.photoUrl ? (
                    <img
                      src={seller.photoUrl}
                      alt={seller.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        marginRight: "10px",
                      }}
                    />
                  ) : (
                    <FaUserCircle size={30} className="me-2" />
                  )}
                  <h6>{seller?.name}</h6>
                </div>
              </Link>
            </div>
            <div>
              {auth.currentUser ? (
                <div className="text-center">
                  {showNumber ? (
                    <p>
                      <FiPhoneCall size={20} /> {ad.contact}
                    </p>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm mb-3"
                      onClick={() => setShowNumber(true)}
                    >
                      Show Contact Info
                    </button>
                  )}
                  <br />
                  {ad.postedBy !== auth.currentUser?.uid && (
                    <button className="btn btn-secondary btn-sm mb-3" onClick={createChatroom}>
                      Chat With Seller
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-center">
                  <Link
                    to="/auth/login"
                    state={{ from: location }}
                    className="text-primary"
                  >
                    Login
                  </Link>{" "}
                  to see contact info
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 text-center">
            {!ad.isSold && ad.postedBy === auth.currentUser?.uid && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={updateStatus}
              >
                Mark as Sold
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <h3>Description</h3>
        <p>{ad.description}</p>
      </div>
    </div>
  ) : null;
};

export default Ad;
