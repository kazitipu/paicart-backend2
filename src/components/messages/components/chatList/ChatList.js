import React, { Component, useEffect, useState } from "react";
import "./chatList.css";
import ChatListItems from "./ChatListItems";
import { connect } from "react-redux";
import { getAllRoomsRedux } from "../../../../actions";
import { firestore, uploadImage } from "../../../../firebase/firebase.utils";
const ChatList = (props) => {
  const [userName, setUserName] = useState("");
  useEffect(() => {
    const roomsRef = firestore.collection("rooms");
    let unsubscribe = roomsRef.onSnapshot((querySnapshot) => {
      console.log("one of the document has changed.");
      let rooms = [];
      querySnapshot.forEach((doc) => {
        rooms.push(doc.data());
      });
      props.getAllRoomsRedux(rooms);
    });
    return () => unsubscribe();
  }, []);

  let filteredUser = [];
  if (userName) {
    filteredUser = props.users.filter(
      (user) =>
        (user.displayName && user.displayName.includes(userName)) ||
        (user.email && user.email.includes(userName))
    );
  }

  let renderableRooms = [];
  if (props.rooms.length > 0) {
    renderableRooms = props.rooms.sort(
      (a, b) =>
        b.lastMessage.createdAt.toDate().getTime() -
        a.lastMessage.createdAt.toDate().getTime()
    );
  }

  return (
    <div className="main__chatlist">
      <div className="chatlist__heading">
        <h2>Chats</h2>
        <button className="btn-nobg">
          <i className="fa fa-ellipsis-h"></i>
        </button>
      </div>
      <div className="chatList__search">
        <div className="search_wrap">
          <input
            type="text"
            placeholder="Search Here"
            name="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <button className="search-btn">
            <i className="fa fa-search"></i>
          </button>
        </div>
      </div>
      <div className="chatlist__items">
        {!userName ? (
          <>
            {renderableRooms.map((item, index) => {
              return (
                <ChatListItems
                  name={item.name}
                  key={item.id}
                  id={item.id}
                  animationDelay={index + 1}
                  active={item.active ? "active" : ""}
                  isOnline={item.isOnline ? "active" : ""}
                  image={item.image}
                  lastMessage={item.lastMessage}
                />
              );
            })}
          </>
        ) : (
          <>
            {filteredUser.map((item, index) => {
              return (
                <ChatListItems
                  name={item.displayName}
                  key={item.uid}
                  id={item.uid}
                  animationDelay={index + 1}
                  active={item.active ? "active" : ""}
                  isOnline={item.isOnline ? "active" : ""}
                  image={item.imageUrl}
                  lastMessage={
                    props.rooms.find((room) => room.id == item.uid)
                      ? props.rooms.find((room) => room.id == item.uid)
                          .lastMessage
                      : { text: "start a conversation" }
                  }
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    rooms: state.chats.rooms,
    users: state.users.users,
  };
};
export default connect(mapStateToProps, { getAllRoomsRedux })(ChatList);
