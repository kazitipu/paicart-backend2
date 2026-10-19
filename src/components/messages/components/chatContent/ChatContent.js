import React, { Component, useState, createRef, useEffect } from "react";

import "./chatContent.css";
import Avatar from "../chatList/Avatar";
import ChatItem from "./ChatItem";
import { connect } from "react-redux";
import {
  firestore,
  uploadImage,
  getSingleUser,
} from "../../../../firebase/firebase.utils";
import { appendMessagesRedux } from "../../../../actions/index";
import { sendNotifications } from "../../../../firebase/fcmRestApi";
const ChatContent = (props) => {
  let messagesEndRef = createRef(null);
  const [msg, setMsg] = useState("");
  const [trigger, setTrigger] = useState("");

  useEffect(() => {
    if (room.messages) {
      if (room.messages.length > 0) {
        console.log("this scroll to bottom is getting called!");
        setTimeout(() => {
          scrollToBottom();
        }, 2000);
      }
    }
  }, [props.room]);

  useEffect(() => {
    const { room } = props;
    const roomRef = firestore.doc(`rooms/${room.id}`);
    const unsubscribe = roomRef.onSnapshot((snapShot) => {
      console.log("append messages is called!");
      if (snapShot.exists) {
        const messagesFirestore = snapShot
          .data()
          .messages.map((message) => {
            return { ...message };
          })
          .sort((a, b) => b.time - a.time);
        console.log(messagesFirestore);
        props.appendMessagesRedux(messagesFirestore);
      } else {
        props.appendMessagesRedux([]);
      }
    });
    return () => unsubscribe();
  }, [trigger]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onSend = async () => {
    const { room, currentAdmin } = props;
    if (!msg) {
      return;
    }
    setTrigger("call");
    const roomRef = firestore.doc(`rooms/${room.id}`);
    const snapShot = await roomRef.get();
    console.log("on send is getting called");
    if (snapShot.exists) {
      await roomRef.update({
        messages: [
          ...snapShot.data().messages,
          {
            text: msg,
            user: {
              name: currentAdmin.name || currentAdmin.email,
              _id: currentAdmin.adminId,
            },
            _id: parseInt(new Date().getTime() * Math.random()),
            sent: true,
            received: false,
            createdAt: new Date(),
          },
        ],
        lastMessage: {
          text: msg,
          user: {
            name: currentAdmin.name || currentAdmin.email,
            _id: currentAdmin.adminId,
          },
          _id: parseInt(new Date().getTime() * Math.random()),
          sent: true,
          received: true,
          createdAt: new Date(),
        },
        time: new Date().getTime(),
      });
      setMsg("");
      console.log("document is upadated!");
      const user = await getSingleUser(snapShot.data().id);
      console.log(user);
      const message = {
        title: "New message",
        body: msg,
      };
      if (user.deviceToken && user.deviceToken.length > 0) {
        user.deviceToken.map((token) => {
          console.log(token);
          sendNotifications(token, message);
        });
      }
    } else {
      await roomRef.set({
        id: room.id,
        messages: [
          {
            text: msg,
            user: {
              name: currentAdmin.name || currentAdmin.email,
              _id: currentAdmin.adminId,
            },
            _id: parseInt(new Date().getTime() * Math.random()),
            sent: true,
            received: false,
            createdAt: new Date(),
          },
        ],
        lastMessage: {
          text: msg,
          user: {
            name: currentAdmin.name || currentAdmin.email,
            _id: currentAdmin.adminId,
          },
          _id: parseInt(new Date().getTime() * Math.random()),
          sent: true,
          received: false,
          createdAt: new Date(),
        },
        time: new Date().getTime(),
      });
      setMsg("");
      const user = await getSingleUser(snapShot.data().id);
      console.log(user);
      const message = {
        title: "New message",
        body: msg,
      };
      if (user.deviceToken && user.deviceToken.length > 0) {
        user.deviceToken.map((token) => {
          console.log(token);
          sendNotifications(token, message);
        });
      }
    }
  };

  const _handleImgChange = async (e, i) => {
    const { room, currentAdmin } = props;
    setTrigger("call");
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {};
    if (file) {
      reader.readAsDataURL(file);
      const imgUrl = await uploadImage(file);
      // here send the message with image
      const message = {
        _id: parseInt(new Date().getTime() * Math.random()),
        text: "",
        createdAt: new Date(),
        user: {
          _id: currentAdmin.adminId,
          name: currentAdmin.name || currentAdmin.email,
        },
        image: imgUrl,
        sent: true,
        received: false,
      };

      const roomRef = firestore.doc(`rooms/${room.id}`);
      const snapShot = await roomRef.get();
      if (snapShot.exists) {
        roomRef.update({
          messages: [...snapShot.data().messages, message],
          lastMessage: message,
          time: new Date().getTime(),
          name: room.name,
          image: room.image,
        });
      } else {
        roomRef.set({
          id: room.id,
          messages: [message],
          lastMessage: message,
          time: new Date().getTime(),
          name: room.name,
          image: room.image,
        });
      }
    }
  };

  const { room, currentAdmin } = props;
  return (
    <div className="main__chatcontent">
      <div className="content__header">
        <div className="blocks">
          {room.messages && room.messages.length > 0 && (
            <div className="current-chatting-user">
              <Avatar isOnline="active" image={room.image} />
              <p>{room.name}</p>
            </div>
          )}
        </div>

        <div className="blocks">
          <div className="settings"></div>
        </div>
      </div>
      {room.messages && room.messages.length > 0 ? (
        <div className="content__body">
          <div className="chat__items">
            {room.messages &&
              room.messages.length > 0 &&
              room.messages.map((itm, index) => {
                return (
                  <ChatItem
                    animationDelay={index + 2}
                    key={index}
                    user={itm.user._id != currentAdmin.adminId ? "other" : "me"}
                    msg={itm.text}
                    image={room.image}
                    received={itm.received}
                    sent={itm.sent}
                    createdAt={itm.createdAt.toDate()}
                    msgImage={itm.image}
                  />
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            color: "#c6c6c6",
            fontSize: "30px",
            marginTop: 100,
          }}
        >
          Choose a chat to start the conversation
        </div>
      )}
      {room.messages && room.messages.length > 0 && (
        <div className="content__footer">
          <div className="sendNewMessage">
            <button
              className="addFiles"
              onClick={() => {
                document.getElementById("upload-image-input").click();
              }}
            >
              <i className="fa fa-plus">
                <input
                  id="upload-image-input"
                  className="upload"
                  type="file"
                  style={{
                    position: "absolute",
                    zIndex: -5,
                    maxWidth: "50px",
                    left: -10,
                    marginTop: "10px",
                    display: "none",
                  }}
                  onChange={(e) => _handleImgChange(e, 0)}
                />
              </i>
            </button>
            <input
              type="text"
              placeholder="Type a message here"
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              value={msg}
            />
            <button
              className="btnSendMsg"
              id="sendMsgBtn"
              onClick={() => onSend()}
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
    room: state.chats.selectedRoom,
  };
};
export default connect(mapStateToProps, { appendMessagesRedux })(ChatContent);
