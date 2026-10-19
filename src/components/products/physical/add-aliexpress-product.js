import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import {
  uploadProduct,
  uploadAliProduct,
} from "../../../firebase/firebase.utils";
import Spinner from "react-bootstrap/Spinner";
import "./add-aliexpress-product.css";
import axios from "axios";
export class Add_product extends Component {
  constructor(props) {
    super(props);
    this.state = {
      store: "1688",
      id: "",
      availability: "in-stock",
      loader: false,
      product: null,
    };
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleFormSubmit = async (event) => {
    this.setState({ loader: true });
    event.preventDefault();

    const _EXTERNAL_URL = `https://alg.com.bd/singleProduct/${this.state.id},${this.state.store}`;
    const response = await axios.get(_EXTERNAL_URL);
    if (response.data) {
      let product = response.data.item.prodct_array
        ? response.data.item.prodct_array
        : response.data.item;
      let imgsArray = product.item_imgs
        ? product.item_imgs.map((item) => item.url)
        : [];

      let productObj = {
        shop_name: product.seller_info.shop_name,
        shop_id: product.seller_info.sid,
        id: product.num_iid,
        detail_url: product.detail_url,
        name: product.title,
        pictures: [product.pic_url, ...imgsArray],
        salePrice: product.price,
        price: product.orginal_price,

        categoryId: product.cid,
        rating: "5.0",
        description: product.desc,
        orders: product.total_sold,
        totalAvailableQuantity: "",
        specs: product.props,
        variants: product.skus ? product.skus.sku : [],
        feedback: [],
        brand: product.brand,
        brandId: product.brandId,
        props_name: product.props_name,
        props_list: product.props_list,
        props_imgs: product.props_imgs ? product.props_imgs : product.prop_imgs,
        item_weight: product.item_weight,
        price_range: product.priceRange
          ? JSON.stringify(product.priceRange)
          : [],
      };
      await uploadAliProduct({
        ...productObj,
        availability: this.state.availability,
        store: this.state.store,
      });
      alert("product added successfully!");
      this.setState({
        id: "",
        availability: "in-stock",
        loader: false,
      });
    } else {
      alert(
        "Slow internet detected during scraping product information. try again"
      );
      this.setState({
        id: "",
        availability: "in-stock",
        loader: false,
      });
    }
  };

  handleDiscard = () => {
    this.setState({
      id: "",
      availability: "in-stock",
    });
  };

  render() {
    const { loader } = this.state;

    return (
      <Fragment>
        <Breadcrumb title="Add Aliexpress Product" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5>Add Stock Product</h5>
                  <h6>
                    just copy and paste the product id from 1688/taobao website.
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row product-adding">
                    <div className="col-xl-12">
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

                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Store :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <select
                                className="form-control digits"
                                id="exampleFormControlSelect1"
                                name="store"
                                value={this.state.store}
                                onChange={this.handleChange}
                              >
                                <option value="1688">1688</option>
                                <option value="taobao">taobao</option>
                              </select>
                            </div>
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
                      {loader ? (
                        <>
                          <div className="loader">Loading...</div>
                          <h5 style={{ color: "gray" }}>
                            wait scraping product information from Aliexpress.it
                            may take upto 10 seconds depending on your internet
                            connection.
                          </h5>
                        </>
                      ) : (
                        ""
                      )}
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
