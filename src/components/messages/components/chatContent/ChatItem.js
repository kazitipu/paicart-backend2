import React, { Component } from "react";
import Avatar from "../chatList/Avatar";
import { connect } from "react-redux";

class ChatItem extends Component {
  constructor(props) {
    super(props);
  }

  isValidHttpUrl = (string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  };

  render() {
    const { currentAdmin, sent, received } = this.props;

    let url;
    if (this.props.msg) {
      url = this.isValidHttpUrl(`${this.props.msg}`);
    }

    return (
      <div
        style={{ animationDelay: `0.8s` }}
        className={`chat__item ${this.props.user ? this.props.user : ""}`}
      >
        <div className="chat__item__content">
          {this.props.msg ? (
            <>
              {url ? (
                <div
                  className="chat__msg"
                  style={{ textDecorationLine: "underline" }}
                >
                  {this.props.user == "other" ? (
                    <a
                      target="_blank"
                      href={this.props.msg}
                      className="link-msg2"
                    >
                      {this.props.msg}
                    </a>
                  ) : (
                    <a
                      target="_blank"
                      href={this.props.msg}
                      className="link-msg"
                    >
                      {this.props.msg}
                    </a>
                  )}
                </div>
              ) : (
                <div className="chat__msg">{this.props.msg}</div>
              )}
            </>
          ) : (
            <div>
              <a target="_blank" href={this.props.msgImage}>
                <img
                  src={this.props.msgImage}
                  style={{ height: 140, width: "100%" }}
                />
              </a>
            </div>
          )}

          <div className="chat__meta">
            <span>{this.props.createdAt.toLocaleDateString("en-GB")}</span>
            <span>{this.props.createdAt.toLocaleTimeString()}</span>
            {this.props.user == "me" && (
              <span>{sent && received ? "✔✔" : "✔"}</span>
            )}
          </div>
        </div>
        {currentAdmin && (
          <Avatar
            isOnline="active"
            image={
              this.props.user === "me" ? currentAdmin.image : this.props.image
            }
          />
        )}
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {})(ChatItem);
