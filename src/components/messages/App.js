import React, { useEffect } from "react";
import "./App.css";
import ChatBody from "./components/chatBody/ChatBody";

import { appendMessagesRedux } from "../../actions";
import { connect } from "react-redux";
import { firestore } from "../../firebase/firebase.utils";
function Message(props) {
  return (
    <div className="__main">
      <ChatBody />
    </div>
  );
}
const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
    room: state.chats.selectedRoom,
  };
};
export default connect(mapStateToProps, { appendMessagesRedux })(Message);
