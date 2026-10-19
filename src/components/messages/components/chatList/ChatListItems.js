import React, { Component } from "react";
import Avatar from "./Avatar";
import { connect } from "react-redux";
import { selectRoomRedux } from "../../../../actions";
class ChatListItems extends Component {
  constructor(props) {
    super(props);
  }
  selectChat = (e) => {
    for (
      let index = 0;
      index < e.currentTarget.parentNode.children.length;
      index++
    ) {
      e.currentTarget.parentNode.children[index].classList.remove("active");
    }

    e.currentTarget.classList.add("active");
    this.props.selectRoomRedux(this.props.id);
  };

  render() {
    let lastMessageRead;
    if (this.props.lastMessage.sent && this.props.lastMessage.received) {
      lastMessageRead = true;
    } else {
      lastMessageRead = false;
    }
    return (
      <div
        style={{ animationDelay: `0.${this.props.animationDelay}s` }}
        onClick={this.selectChat}
        className={`chatlist__item ${
          this.props.active ? this.props.active : ""
        } ${lastMessageRead ? "" : "unread-msg"}`}
      >
        <Avatar
          image={
            this.props.image ? this.props.image : "http://placehold.it/80x80"
          }
          isOnline={this.props.isOnline}
        />

        <div className="userMeta">
          <p>{this.props.name}</p>
          <span className="activeTime">
            {this.props.lastMessage.text
              ? this.props.lastMessage.text.slice(0, 15)
              : "sent an attachment"}
          </span>
        </div>
      </div>
    );
  }
}

export default connect(null, { selectRoomRedux })(ChatListItems);
