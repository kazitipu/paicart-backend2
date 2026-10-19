import React, { Component, Fragment } from "react";

export class Language extends Component {
  render() {
    return (
      <Fragment>
        <ul className="language-dropdown onhover-show-div p-20">
          <li>
            <a href="javascript:void(0)" data-lng="en">
              <i className="flag-icon flag-icon-is"></i> English
            </a>
          </li>
        </ul>
      </Fragment>
    );
  }
}

export default Language;
