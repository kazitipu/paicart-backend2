import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import addProduct from "../../../assets/images/addProduct.png";
import { uploadImage, uploadProduct } from "../../../firebase/firebase.utils";

export class Add_product extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      price: "",
      salePrice: "",
      pictures: [addProduct, addProduct, addProduct, addProduct],
      availability: "in-stock",
      shortDetails: "",
      description: "",
      stock: "",
      new: "true",
      sale: "false",
      category: "Bags",
      colors: [],
      size: [],
      rating: 5,
      file: "",
    };
  }

  IncrementItem = () => {
    this.setState((prevState) => {
      if (prevState.quantity < 9) {
        return {
          quantity: prevState.quantity + 1,
        };
      } else {
        return null;
      }
    });
  };
  DecreaseItem = () => {
    this.setState((prevState) => {
      if (prevState.quantity > 0) {
        return {
          quantity: prevState.quantity - 1,
        };
      } else {
        return null;
      }
    });
  };
  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleFormSubmit = async (event) => {
    event.preventDefault();
    const discount = Math.round(
      100 - (this.state.salePrice * 100) / this.state.price
    );
    console.log(discount);

    await uploadProduct(this.state, discount);
    this.setState({
      id: "",
      name: "",
      price: "",
      salePrice: "",
      pictures: [addProduct, addProduct, addProduct, addProduct],
      shortDetails: "",
      description: "",
      stock: "",
      availability: "in-stock",
      new: "true",
      sale: "false",
      category: "Bags",
      colors: [],
      size: [],
      rating: 5,
      file: "",
    });
  };

  //image upload
  handleMainImgChange = async (event) => {
    event.preventDefault();
    let reader = new FileReader();
    let file = event.target.files[0];
    console.log(file);
    reader.onloadend = () => {
      this.setState({
        file,
        mainImg: reader.result,
      });
    };
    if (file) {
      reader.readAsDataURL(file);
      const imgUrl = await uploadImage(file);
      console.log(imgUrl);
      this.setState({
        mainImg: imgUrl,
      });
    }
  };

  // _handleSubmit(e) {
  //     e.preventDefault();
  // }

  _handleImgChange = async (e, i) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];
    const { pictures } = this.state;

    reader.onloadend = () => {
      pictures[i] = reader.result;
      this.setState({
        file: file,
        pictures,
      });
    };
    if (file) {
      reader.readAsDataURL(file);
      const imgUrl = await uploadImage(file);
      console.log(imgUrl);
      pictures[i] = imgUrl;
      this.setState({
        pictures,
      });
      console.log(pictures);
    }
  };

  handleDiscard = () => {
    this.setState({
      id: "",
      name: "",
      price: "",
      salePrice: "",
      discount: "",
      pictures: [addProduct, addProduct, addProduct, addProduct],
      shortDetails: "",
      description: "",
      stock: "",
      availability: "in-stock",
      new: "true",
      sale: "false",
      category: "Bags",
      colors: [],
      size: [],
      rating: 5,
      file: "",
    });
  };

  render() {
    return (
      <Fragment>
        <Breadcrumb title="Add Product" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5>Add Product</h5>
                </div>
                <div className="card-body">
                  <div className="row product-adding">
                    <div className="col-xl-5">
                      <div className="add-product">
                        <div className="row">
                          <div
                            className="col-xl-9 xl-50 col-sm-6 col-9"
                            style={{ cursor: "pointer" }}
                          >
                            <div className="box-input-file">
                              <img
                                src={this.state.pictures[0]}
                                alt="product"
                                className="img-fluid image_zoom_1 blur-up lazyloaded"
                              />
                              <input
                                className="upload"
                                type="file"
                                onChange={(e) => this._handleImgChange(e, 0)}
                              />
                            </div>
                          </div>
                          <div
                            className="col-xl-3 xl-50 col-sm-6 col-3"
                            style={{ cursor: "pointer" }}
                          >
                            <ul className="file-upload-product">
                              {this.state.pictures
                                .filter((res, i) => i !== 0)
                                .map((res, i) => {
                                  return (
                                    <li key={i}>
                                      <div className="box-input-file">
                                        <input
                                          className="upload"
                                          type="file"
                                          onChange={(e) =>
                                            this._handleImgChange(e, i + 1)
                                          }
                                        />
                                        <img
                                          src={res}
                                          style={{ width: 50, height: 50 }}
                                        />
                                        {/* <a id="result1" onClick={(e) => this._handleSubmit(e.target.id)}></a> */}
                                      </div>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-7">
                      <form
                        className="needs-validation add-product-form"
                        onSubmit={this.handleFormSubmit}
                      >
                        <div className="form form-label-center">
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Product Id :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="id"
                                value={this.state.id}
                                type="text"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Product Name :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="name"
                                value={this.state.name}
                                type="text"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Price :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control mb-0"
                                name="price"
                                value={this.state.price}
                                type="number"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              salePrice :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control mb-0"
                                name="salePrice"
                                value={this.state.salePrice}
                                type="number"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Short Details :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="shortDetails"
                                value={this.state.shortDetails}
                                type="text"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              New :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="new"
                                value={this.state.new}
                                type="boolean"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              On Sale :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="sale"
                                value={this.state.sale}
                                type="boolean"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>

                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Available colors :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control "
                                name="colors"
                                value={this.state.colors}
                                type="array"
                                onChange={this.handleChange}
                                required={false}
                              />
                            </div>
                            <div className="invalid-feedback offset-sm-4 offset-xl-3">
                              Please choose Valid Code.
                            </div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Available sizes :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control "
                                name="size"
                                value={this.state.size}
                                type="array"
                                onChange={this.handleChange}
                                required={false}
                              />
                            </div>
                            <div className="invalid-feedback offset-sm-4 offset-xl-3">
                              Please choose Valid Code.
                            </div>
                          </div>
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Product rating :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control "
                                name="rating"
                                value={this.state.rating}
                                type="number"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="invalid-feedback offset-sm-4 offset-xl-3">
                              Please choose Valid Code.
                            </div>
                          </div>
                        </div>
                        <div className="form">
                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Category :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <select
                                className="form-control digits"
                                id="exampleFormControlSelect1"
                                name="category"
                                value={this.state.category}
                                onChange={this.handleChange}
                              >
                                <option>Bags</option>
                                <option>Beauty</option>
                                <option>Fashion</option>
                                <option>Watch</option>
                                <option>Kids</option>
                                <option>others</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Product Availability :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <select
                                className="form-control digits"
                                id="exampleFormControlSelect1"
                                name="availability"
                                value={this.state.availability}
                                onChange={this.handleChange}
                              >
                                <option>in-stock</option>
                                <option>pre-order</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              On sale :
                            </label>
                            <fieldset className="qty-box ml-0">
                              <div className="input-group bootstrap-touchspin">
                                <div className="input-group-prepend">
                                  <button
                                    className="btn btn-primary btn-square bootstrap-touchspin-down"
                                    type="button"
                                    onClick={this.DecreaseItem}
                                  >
                                    <i className="fa fa-minus"></i>
                                  </button>
                                </div>
                                <div className="input-group-prepend">
                                  <span className="input-group-text bootstrap-touchspin-prefix"></span>
                                </div>
                                <input
                                  className="touchspin form-control"
                                  name="stock"
                                  type="text"
                                  value={this.state.stock}
                                  onChange={this.handleChange}
                                  required={false}
                                />
                                <div className="input-group-append">
                                  <span className="input-group-text bootstrap-touchspin-postfix"></span>
                                </div>
                                <div className="input-group-append ml-0">
                                  <button
                                    className="btn btn-primary btn-square bootstrap-touchspin-up"
                                    type="button"
                                    onClick={this.IncrementItem}
                                  >
                                    <i className="fa fa-plus"></i>
                                  </button>
                                </div>
                              </div>
                            </fieldset>
                          </div>
                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4">
                              Add Description:
                            </label>
                            <textarea
                              className="form-control"
                              style={{ marginTop: "1rem" }}
                              rows="10"
                              type="text"
                              name="description"
                              value={this.state.description}
                              onChange={this.handleChange}
                            ></textarea>
                          </div>
                        </div>
                        <div className="offset-xl-3 offset-sm-4">
                          <button type="submit" className="btn btn-primary">
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={this.handleDiscard}
                            className="btn btn-light"
                          >
                            Discard
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default Add_product;
