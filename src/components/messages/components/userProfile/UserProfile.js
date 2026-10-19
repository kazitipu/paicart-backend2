import React, { Component } from "react";
import "./userProfile.css";
import { connect } from "react-redux";
class UserProfile extends Component {
  toggleInfo = (e) => {
    e.target.parentNode.classList.toggle("open");
  };
  render() {
    const { currentAdmin } = this.props;
    return (
      <div className="main__userprofile">
        <div className="profile__card user__profile__image">
          <div className="profile__image">
            {currentAdmin && <img src={currentAdmin.image} />}
          </div>
          <h4>{currentAdmin && currentAdmin.name}</h4>
          <p>{currentAdmin && currentAdmin.status}</p>
          <p>Paicart Team</p>
        </div>
        <div className="profile__card">
          <div className="card__header" onClick={this.toggleInfo}>
            <h4>Information</h4>
            <i className="fa fa-angle-down"></i>
          </div>
          <div className="card__content">
            {currentAdmin && currentAdmin.email}
          </div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps)(UserProfile);
