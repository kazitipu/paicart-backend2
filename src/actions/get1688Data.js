import Axios from "axios";
import CryptoJS from "crypto-js";
import qs from "qs";
import {
  upload1688Category,
  addToRootCategory,
  level3Category,
} from "../firebase/firebase.utils";
// Procedure ta hobe eivhabe j 24 ta kore bag, sneakers, shirt, latest products kore daily import kore rakhbo schedule kore dine ekbar. And save the data to firebase firestore.
// kono user ashle firebase theke data ene dekhabo. not api in homepage.
// link search ba keyword search korle direct api theke data ene dekhabo 30 ta 30 ta kore per hit.
// kono category te click korle oitao api theke dekhabo 30 ta 30 ta kore.

// paicart instancekey
const instanceKey = "6417507a-3562-4032-9162-5bc1c8c6e159";

export const batchGetItemFullInfo = async (itemId) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === Your actual offerId and country ===
  let offerDetailParam = JSON.stringify({
    offerId: itemId,
    country: "en",
  });

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/product.search.queryProductDetail/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    offerDetailParam: offerDetailParam, // raw JSON string
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/product.search.queryProductDetail/9077165`,
    qs.stringify({
      offerDetailParam: offerDetailParam,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (resultObj.data && resultObj.data.result && resultObj.data.result.result) {
    const item = resultObj.data.result.result;
    let specs = [];
    if (item.productAttribute && item.productAttribute.length > 0) {
      item.productAttribute.map((attr) => {
        let IsConfigurator = false;
        let skuImageUrl = null;
        let valueTrans = attr.valueTrans;
        if (item.productSkuInfos && item.productSkuInfos.length > 0) {
          if (
            item.productSkuInfos[0].skuAttributes.find(
              (skuAttr) => skuAttr.attributeId == attr.attributeId,
            )
          ) {
            IsConfigurator = true;
            for (const sku of item.productSkuInfos) {
              const match = sku.skuAttributes.find(
                (skuAttr) =>
                  skuAttr.value.trim().toLowerCase() ===
                  attr.value.trim().toLowerCase(),
              );

              if (match) {
                skuImageUrl = match.skuImageUrl || null;
                valueTrans = match.valueTrans;
                break; // Exit loop early once found
              }
            }
          }
        }
        if (
          specs.find((specsAttr) => specsAttr.attributeId == attr.attributeId)
        ) {
          specs = specs.map((specsAttr) => {
            if (specsAttr.attributeId == attr.attributeId) {
              return {
                ...specsAttr,
                value: `${specsAttr.value},|]${valueTrans}`,
                array: [
                  ...specsAttr.array,
                  {
                    Pid: attr.attributeId,
                    Vid: valueTrans,
                    name: attr.attributeNameTrans,
                    value: valueTrans,
                    skuImageUrl,
                  },
                ],
                IsConfigurator: IsConfigurator,
              };
            } else {
              return specsAttr;
            }
          });
        } else {
          specs.push({
            name: attr.attributeNameTrans,
            value: valueTrans,
            attributeId: attr.attributeId,
            array: [
              {
                Pid: attr.attributeId,
                Vid: valueTrans,
                name: attr.attributeNameTrans,
                value: valueTrans,
                skuImageUrl,
              },
            ],
            IsConfigurator: IsConfigurator,
            PropertyName: attr.attributeNameTrans,
          });
        }
      });
    }
    let props_imgs = [];
    if (specs.length > 0) {
      specs
        .filter((attr1) => attr1.IsConfigurator)
        .map((attr) => {
          attr.array
            .filter((colorSize) => colorSize.skuImageUrl)
            .map((attr2, index) => {
              props_imgs.push({
                properties: `0:${index}`,
                url: attr2.skuImageUrl,
                propertyName: attr2.name,
                value: attr2.value,
              });
            });
        });
    }
    let props_list = {};

    if (specs.length > 0) {
      specs
        .filter((attr1) => attr1.IsConfigurator)
        .map((attr, index) => {
          attr.array.map((attr2, index2) => {
            props_list = {
              ...props_list,
              [`${index}:${index2}`]: `${attr.PropertyName}:${attr2.value}`,
            };
            return props_list;
          });
        });
    }

    // propertyNames is only needed to make dynamic property name like color,size,specification,weight
    let propertyNames = [];
    if (item.productSkuInfos && item.productSkuInfos.length > 0) {
      item.productSkuInfos[0].skuAttributes.map((attr) => {
        propertyNames.push(attr.attributeNameTrans);
      });
    }
    // props_list3 is only needed to remove duplicate if there is same color.
    let props_list3 = {};
    if (specs.length > 0) {
      specs
        .filter((attr1) => attr1.IsConfigurator)
        .map((attr, index) => {
          attr.array.map((attr2, index2) => {
            props_list3 = {
              ...props_list3,
              [`${index}:${index2}`]: attr2,
            };
            return props_list3;
          });
        });
    }

    // props_list2 is only needed to make variant
    let props_list2 = [];
    if (item.productSkuInfos && item.productSkuInfos.length > 0) {
      Object.keys(props_list3).forEach((key, index) => {
        specs
          .filter((attr) => attr.IsConfigurator)
          .map((attribute2) => {
            attribute2.array.map((attribute) => {
              if (
                `${attribute.Pid}:${attribute.Vid}` ==
                `${props_list3[key].Pid}:${props_list3[key].Vid}`
              ) {
                props_list2.push({ ...attribute, [key]: props_list[key] });
              }
            });
          });
      });
    }

    let variants = [];
    if (item.productSkuInfos && item.productSkuInfos.length > 0) {
      item.productSkuInfos.map((sku) => {
        let properties = getProperties(sku, props_list2);
        // proti ta varinat er different weight ber korar jonno
        let skuShippingDetail = null;
        if (
          item.productShippingInfo &&
          item.productShippingInfo.skuShippingDetails &&
          item.productShippingInfo.skuShippingDetails.length > 0
        ) {
          skuShippingDetail = item.productShippingInfo.skuShippingDetails.find(
            (sku1) => sku1.skuId == sku.skuId,
          );
        }

        variants.push({
          price: sku.promotionPrice
            ? sku.promotionPrice
            : sku.price
              ? sku.price
              : sku.consignPrice
                ? sku.consignPrice
                : sku.fenxiaoPriceInfo && sku.fenxiaoPriceInfo.offerPrice
                  ? sku.fenxiaoPriceInfo.offerPrice
                  : "",
          properties: properties.properties,
          properties_name: properties.propertiesName,
          quantity: sku.amountOnSale,
          sales: 0,
          sku_id: sku.skuId,
          spec_id: sku.specId,
          total_price: 0,
          weight:
            skuShippingDetail && skuShippingDetail.weight
              ? skuShippingDetail.weight
              : "",
        });
      });
    }

    // varaint er khetre weight thaktese in productShippingInfo.skuShippingDetails[0].weight
    // no sku, no variants, no price variant er khetre weight thaktese in productShippingInfo.weight
    // productShippingInfo.weight thakle eta use hobe, r na thakle productShippingInfo.skuShippingDetails[0].weight use hobe
    const product = {
      availability: "pre-order",
      brand: "",
      brandId: "",
      categoryId: item.categoryId,
      description: item.description,
      detail_url: item.promotionUrl,
      feedback: [],
      id: item.offerId,
      propertyNames,
      item_weight: item.productShippingInfo.weight
        ? item.productShippingInfo.weight
        : item.productShippingInfo.skuShippingDetails &&
            item.productShippingInfo.skuShippingDetails.length > 0
          ? item.productShippingInfo.skuShippingDetails[0].weight
          : 0,

      name: item.subjectTrans,
      totalSold: item.soldOut,
      orders:
        item.FeaturedValues &&
        item.FeaturedValues.length > 0 &&
        item.FeaturedValues.find((prop) => prop.Name == "SalesInLast30Days")
          ? item.FeaturedValues.find((prop) => prop.Name == "SalesInLast30Days")
              .Value
          : 20,
      rating: item.tradeScore,

      pictures: item.productImage.images,
      price: item.productSaleInfo?.consignPrice,

      price_range:
        item.productSaleInfo?.priceRangeList &&
        item.productSaleInfo?.priceRangeList.length > 1
          ? JSON.parse(
              `[${item.productSaleInfo.priceRangeList
                .slice(0, 3)
                .map((quantity) => {
                  return `[${quantity.startQuantity}, ${quantity.price}]`;
                })}]`,
            )
          : "",
      specs: specs.filter((spec) => !spec.IsConfigurator),
      videos: [{ PreviewUrl: "", Url: item.mainVideo }],
      salePrice: item.productSaleInfo?.consignPrice,
      shop_id: item.sellerOpenId,
      shop_name: item.companyName,
      shop_rating: item.sellerDataInfo
        ? item.sellerDataInfo.compositeServiceScore
        : "4.0",
      relatedGroups:
        item.RelatedGroups && item.RelatedGroups.length > 0
          ? item.RelatedGroups
          : [],
      store: "1688",
      totalAvailableQuantity: item.productSaleInfo?.amountOnSale,
      props_list: props_list,
      props_name: "",
      props_imgs: {
        prop_img: props_imgs,
      },
      variants: variants,
      moq: item.minOrderQuantity,
    };
    console.log(product);

    return product;
  } else {
    return null;
  }
};
const getProperties = (sku, props_list2) => {
  let properties = "";
  let propertiesName = "";

  // console.log(props_list2);

  sku.skuAttributes.forEach((config, index) => {
    // Try to find matching attribute
    let obj = props_list2.find((prop) => {
      // console.log(
      //   `[Match Check] prop.Pid: ${prop.Pid}, prop.Vid: ${prop.Vid} | config.attributeId: ${config.attributeId}, config.valueTrans: ${config.valueTrans}`
      // );
      return prop.Vid == config.valueTrans && prop.Pid == config.attributeId;
    });

    if (!obj) {
      // console.warn(
      //   `[Warning] No match found for attributeId: ${config.attributeId}, valueTrans: ${config.valueTrans}`
      // );
      return; // Skip this config
    }

    // Extract key like "0:2"
    let key = Object.keys(obj).find((k) => k.includes(":"));
    if (!key) {
      console.warn(`[Warning] No key like "0:x" found in obj:`, obj);
      return;
    }

    // Build key-value pair: "0:2:Color:Black"
    let keyValue = `${key}:${obj[key]}`;

    // Append to strings
    properties += properties ? `;${key}` : key;
    propertiesName += propertiesName ? `;${keyValue}` : keyValue;

    // console.log(
    //   `[Success] Added -> properties: ${key}, propertiesName: ${keyValue}`
    // );
  });

  return { properties, propertiesName };
};

export const getItemDescription = async (itemId) => {
  const resultObj = await Axios.get(
    `https://otapi.net/service-json/GetItemDescription?instanceKey=${instanceKey}&language=&signature=&timestamp=&itemId=abb-${itemId}`,
  );
  if (resultObj.data && resultObj.data.OtapiItemDescription) {
    return resultObj.data.OtapiItemDescription.ItemDescription;
  } else {
    return null;
  }
};

export const batchSearchItemsFrameByTitle = async (
  keyword,
  framePosition,
  filterByCategory,
) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === Your actual offerId and country ===
  let offerQueryParam = JSON.stringify({
    keyword: keyword,
    beginPage: framePosition,
    pageSize: 50,
    country: "en",
  });

  if (filterByCategory && filterByCategory != "Default") {
    offerQueryParam = JSON.stringify({
      keyword: keyword,
      beginPage: framePosition,
      pageSize: 50,
      sort: filterByCategory,
      country: "en",
    });
  }

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/product.search.keywordQuery/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    offerQueryParam: offerQueryParam, // raw JSON string
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/product.search.keywordQuery/9077165`,
    qs.stringify({
      offerQueryParam: offerQueryParam,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);

  // if (filterByCategory && filterByCategory !== "Default") {
  //   resultObj = await Axios.get(
  //     `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CItemTitle%3E${keyword}%3C%2FItemTitle%3E%0D%0A%3COrderBy%3E${filterByCategory}%3C%2FOrderBy%3E%0D%0A%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`
  //   );
  // } else {
  //   resultObj = await Axios.get(
  //     `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CItemTitle%3E${keyword}%3C%2FItemTitle%3E+%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`
  //   );
  // }

  if (resultObj.data && resultObj.data.result && resultObj.data.result.result) {
    let products = [];
    let array = resultObj.data.result.result.data
      ? resultObj.data.result.result.data
      : [];
    let totalRecords = resultObj.data.result.result.totalRecords;
    if (array) {
      array.map((item) => {
        const product = {
          availability: "pre-order",
          brand: item.BrandName ? item.BrandName : "",
          brandId: item.BrandId ? item.BrandId : "",
          categoryId: item.topCategoryId,
          description: "",
          detail_url: item.promotionUrl,
          feedback: [],
          id: item.offerId,
          item_weight: 0,
          name: item.subjectTrans,
          totalSold: item.monthSold,
          orders: item.monthSold,
          pictures: [item.imageUrl],
          price: item.priceInfo.price,
          price_range: "",
          specs: [],
          videos: null,
          salePrice: item.priceInfo.price,
          rating: item.tradeScore,
          shop_id: "",
          shop_name: "",
          shop_rating: "",
          relatedGroups: [],
          store: "1688",
          totalAvailableQuantity: item.MasterQuantity,
          props_list: [],
          props_name: "",
          props_imgs: {
            prop_img: [],
          },
          variants: [],
          // repuarchase rate percentage
          repurchaseRate: item.repurchaseRate,
          moq: item.minOrderQuantity,
        };

        products.push(product);
      });
    }

    console.log(array);
    console.log(products);
    return { products: products, totalRecords: totalRecords };
  } else {
    return null;
  }
};
export const batchItemChinaShippingCost = async (productId, totalQuantity) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === Your actual offerId and country ===
  let productFreightQueryParamsNew = JSON.stringify({
    offerId: productId,
    toProvinceCode: "440000",
    toCityCode: "440100",
    toCountryCode: "440111",
    totalNum: totalQuantity,
    logisticsSkuNumModels: [],
  });

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/product.freight.estimate/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    productFreightQueryParamsNew: productFreightQueryParamsNew, // raw JSON string
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/product.freight.estimate/9077165`,
    qs.stringify({
      productFreightQueryParamsNew: productFreightQueryParamsNew,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (resultObj.data && resultObj.data.result && resultObj.data.result.result) {
    return resultObj.data.result.result;
  } else {
    return null;
  }
};
export const GetAllShippingAddress = async (productId, totalQuantity) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.trade/alibaba.trade.receiveAddress.get/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.trade/alibaba.trade.receiveAddress.get/9077165`,
    qs.stringify({
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (
    resultObj.data &&
    resultObj.data.result &&
    resultObj.data.result.receiveAddressItems &&
    resultObj.data.result.receiveAddressItems.length > 0
  ) {
    return resultObj.data.result.receiveAddressItems;
  } else {
    return null;
  }
};
export const batchSearchItemsFrameByVendorId = async (
  vendorId,
  framePosition,
  filterByCategory,
) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === Your actual offerId and country ===
  let offerQueryParam = JSON.stringify({
    beginPage: framePosition,
    pageSize: 50,
    country: "en",
    sellerOpenId: vendorId,
  });

  if (filterByCategory && filterByCategory != "Default") {
    offerQueryParam = JSON.stringify({
      beginPage: framePosition,
      pageSize: 50,
      sort: filterByCategory,
      country: "en",
      sellerOpenId: vendorId,
    });
  }

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/product.search.querySellerOfferList/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    offerQueryParam: offerQueryParam, // raw JSON string
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/product.search.querySellerOfferList/9077165`,
    qs.stringify({
      offerQueryParam: offerQueryParam,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);

  if (resultObj.data && resultObj.data.result && resultObj.data.result.result) {
    let products = [];
    let array = resultObj.data.result.result.data
      ? resultObj.data.result.result.data
      : [];
    let totalRecords = resultObj.data.result.result.totalRecords;
    if (array) {
      array.map((item) => {
        const product = {
          availability: "pre-order",
          brand: item.BrandName ? item.BrandName : "",
          brandId: item.BrandId ? item.BrandId : "",
          categoryId: item.topCategoryId,
          description: "",
          detail_url: item.promotionUrl,
          feedback: [],
          id: item.offerId,
          item_weight: 0,
          name: item.subjectTrans,
          totalSold: item.monthSold,
          orders: item.monthSold,
          pictures: [item.imageUrl],
          price: item.priceInfo.price,
          price_range: "",
          specs: [],
          videos: null,
          salePrice: item.priceInfo.price,
          rating: item.tradeScore ? item.tradeScore : 5.0,
          shop_id: "",
          shop_name: "",
          shop_rating: "",
          relatedGroups: [],
          store: "1688",
          totalAvailableQuantity: item.MasterQuantity,
          props_list: [],
          props_name: "",
          props_imgs: {
            prop_img: [],
          },
          variants: [],
          // repuarchase rate percentage
          repurchaseRate: item.repurchaseRate,
          moq: item.minOrderQuantity,
        };

        products.push(product);
      });
    }

    console.log(array);
    console.log(products);
    return { products: products, totalRecords: totalRecords };
  } else {
    return null;
  }
};
export const batchSearchItemsFrameByCategoryId = async (
  categoryId,
  framePosition,
  filterByCategory,
) => {
  let resultObj = null;
  if (filterByCategory && filterByCategory !== "Default") {
    resultObj = await Axios.get(
      `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CCategoryId%3Eabb-${categoryId}%3C%2FCategoryId%3E%0D%0A%3COrderBy%3E${filterByCategory}%3C%2FOrderBy%3E%0D%0A%%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`,
    );
  } else {
    resultObj = await Axios.get(
      `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CCategoryId%3Eabb-${categoryId}%3C%2FCategoryId%3E+%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`,
    );
  }

  if (resultObj.data && resultObj.data.Result && resultObj.data.Result) {
    let products = [];
    let array = resultObj.data.Result.Items.Items.Content;

    array.map((item) => {
      const product = {
        availability: "pre-order",
        brand: item.BrandName ? item.BrandName : "",
        brandId: item.BrandId ? item.BrandId : "",
        categoryId: item.ExternalCategoryId,
        description: "",
        detail_url: item.ExternalItemUrl,
        feedback: [],
        id: item.Id.replace("abb-", ""),
        item_weight: item.PhysicalParameters.Weight
          ? item.PhysicalParameters.Weight
          : 0,
        name: item.Title,
        totalSold:
          item.FeaturedValues &&
          item.FeaturedValues.length > 0 &&
          item.FeaturedValues.find((prop) => prop.Name == "TotalSales")
            ? item.FeaturedValues.find((prop) => prop.Name == "TotalSales")
                .Value
            : 355,

        orders:
          item.FeaturedValues &&
          item.FeaturedValues.length > 0 &&
          item.FeaturedValues.find((prop) => prop.Name == "SalesInLast30Days")
            ? item.FeaturedValues.find(
                (prop) => prop.Name == "SalesInLast30Days",
              ).Value
            : 20,

        pictures: item.Pictures.map((picture) => {
          return picture.Url;
        }),
        price: item.Price.OriginalPrice,
        price_range:
          item.QuantityRanges && item.QuantityRanges.length > 0
            ? `[${item.QuantityRanges.slice(0, 3).map((quantity) => {
                return `[${quantity.MinQuantity}, ${quantity.Price.OriginalPrice}]`;
              })}]`
            : "",
        specs: [],
        videos: null,
        salePrice: item.Price.MarginPrice,
        rating: "5.0",
        shop_id: item.VendorId,
        shop_name: item.VendorName,
        shop_rating: item.VendorScore,
        relatedGroups: [],
        store: "1688",
        totalAvailableQuantity: item.MasterQuantity,
        props_list: [],
        props_name: "",
        props_imgs: {
          prop_img: [],
        },
        variants: [],
      };

      products.push(product);
    });
    console.log(array);
    console.log(products);
    return products;
  } else {
    return null;
  }
};
export const SearchRatingListItems = async (type, framePosition) => {
  const resultObj = await Axios.get(
    `https://otapi.net/service-json/SearchRatingListItems?instanceKey=${instanceKey}&language=en&signature=&timestamp=&xmlSearchParameters=%3CRatingListItemSearchParameters%3E%0D%0A++%3CCategoryId%3E0%3C%2FCategoryId%3E%0D%0A++%3CItemRatingType%3E${type}%3C%2FItemRatingType%3E%0D%0A%3C%2FRatingListItemSearchParameters%3E&framePosition=${framePosition}&frameSize=50`,
  );
  console.log(resultObj.data);
  if (resultObj.data && resultObj.data.OtapiItemInfoSubList) {
    let products = [];
    let array = resultObj.data.OtapiItemInfoSubList.Content;

    array.map((item) => {
      const product = {
        availability: "pre-order",
        brand: item.BrandName ? item.BrandName : "",
        brandId: item.BrandId ? item.BrandId : "",
        categoryId: item.ExternalCategoryId,
        description: "",
        detail_url: item.ExternalItemUrl,
        feedback: [],
        id: item.Id.replace("abb-", ""),
        item_weight: item.PhysicalParameters.Weight
          ? item.PhysicalParameters.Weight
          : 0,
        name: item.Title,
        totalSold:
          item.FeaturedValues &&
          item.FeaturedValues.length > 0 &&
          item.FeaturedValues.find((prop) => prop.Name == "TotalSales")
            ? item.FeaturedValues.find((prop) => prop.Name == "TotalSales")
                .Value
            : 355,

        orders:
          item.FeaturedValues &&
          item.FeaturedValues.length > 0 &&
          item.FeaturedValues.find((prop) => prop.Name == "SalesInLast30Days")
            ? item.FeaturedValues.find(
                (prop) => prop.Name == "SalesInLast30Days",
              ).Value
            : 20,

        pictures: item.Pictures.map((picture) => {
          return picture.Url;
        }),
        price: item.Price.OriginalPrice,
        price_range:
          item.QuantityRanges && item.QuantityRanges.length > 0
            ? `[${item.QuantityRanges.slice(0, 3).map((quantity) => {
                return `[${quantity.MinQuantity}, ${quantity.Price.OriginalPrice}]`;
              })}]`
            : "",
        specs: [],
        videos: null,
        salePrice: item.Price.MarginPrice,
        rating: "5.0",
        shop_id: item.VendorId,
        shop_name: item.VendorName,
        shop_rating: item.VendorScore,
        relatedGroups: [],
        store: "1688",
        totalAvailableQuantity: item.MasterQuantity,
        props_list: [],
        props_name: "",
        props_imgs: {
          prop_img: [],
        },
        variants: [],
      };

      products.push(product);
    });
    console.log(array);
    console.log(products);
    return products;
  } else {
    return null;
  }
};

export const batchSearchItemsByImage = async (
  imgId,
  framePosition,
  filterByCategory,
) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === Your actual offerId and country ===
  let offerQueryParam = JSON.stringify({
    imageId: imgId,
    beginPage: framePosition,
    pageSize: 50,
    country: "en",
  });

  if (filterByCategory && filterByCategory != "Default") {
    offerQueryParam = JSON.stringify({
      imageId: imgId,
      beginPage: framePosition,
      pageSize: 50,
      sort: filterByCategory,
      country: "en",
    });
  }

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/product.search.imageQuery/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    offerQueryParam: offerQueryParam, // raw JSON string
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/product.search.imageQuery/9077165`,
    qs.stringify({
      offerQueryParam: offerQueryParam,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);

  // if (filterByCategory && filterByCategory !== "Default") {
  //   resultObj = await Axios.get(
  //     `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CItemTitle%3E${keyword}%3C%2FItemTitle%3E%0D%0A%3COrderBy%3E${filterByCategory}%3C%2FOrderBy%3E%0D%0A%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`
  //   );
  // } else {
  //   resultObj = await Axios.get(
  //     `https://otapi.net/service-json/BatchSearchItemsFrame?instanceKey=${instanceKey}&language=en&signature=&timestamp=&sessionId=&xmlParameters=%3CSearchItemsParameters%3E%3CItemTitle%3E${keyword}%3C%2FItemTitle%3E+%3C%2FSearchItemsParameters%3E&framePosition=${framePosition}&frameSize=50&blockList=`
  //   );
  // }

  if (resultObj.data && resultObj.data.result && resultObj.data.result.result) {
    let products = [];
    let array = resultObj.data.result.result.data
      ? resultObj.data.result.result.data
      : [];
    let totalRecords = resultObj.data.result.result.totalRecords;

    if (array) {
      array.map((item) => {
        const product = {
          availability: "pre-order",
          brand: item.BrandName ? item.BrandName : "",
          brandId: item.BrandId ? item.BrandId : "",
          categoryId: item.topCategoryId,
          description: "",
          detail_url: item.promotionUrl,
          feedback: [],
          id: item.offerId,
          item_weight: 0,
          name: item.subjectTrans,
          totalSold: item.monthSold,
          orders: item.monthSold,
          pictures: [item.imageUrl],
          price: item.priceInfo.price,
          price_range: "",
          specs: [],
          videos: null,
          salePrice: item.priceInfo.price,
          rating: item.tradeScore,
          shop_id: "",
          shop_name: "",
          shop_rating: "",
          relatedGroups: [],
          store: "1688",
          totalAvailableQuantity: item.MasterQuantity,
          props_list: [],
          props_name: "",
          props_imgs: {
            prop_img: [],
          },
          variants: [],
          // repuarchase rate percentage
          repurchaseRate: item.repurchaseRate,
          moq: item.minOrderQuantity,
        };

        products.push(product);
      });
    }

    console.log(array);
    console.log(products);
    return { products: products, totalRecords: totalRecords };
  } else {
    return null;
  }
};
export const get1688OrderDetails = async (orderId) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.trade/alibaba.trade.get.buyerView/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    webSite: "1688",
    orderId: `${orderId}`,
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.trade/alibaba.trade.get.buyerView/9077165`,
    qs.stringify({
      webSite: "1688",
      orderId: `${orderId}`,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (resultObj && resultObj.data && resultObj.data.result) {
    return resultObj.data.result;
  } else {
    return null;
  }
};
/* The two authoritative figures from the order-detail response, mirrored onto
 * our own order records as `actual1688OrderTotal` / `actual1688OrderShippingFee`
 * so the list can show what an order really cost without re-hitting the API
 * once per row. Returns null when the response carries neither. */
export const extract1688Actuals = (details) => {
  const baseInfo = details && details.baseInfo;
  if (!baseInfo) return null;
  const total = parseFloat(baseInfo.totalAmount);
  const shippingFee = parseFloat(baseInfo.shippingFee);
  if (!Number.isFinite(total) && !Number.isFinite(shippingFee)) return null;
  return {
    actual1688OrderTotal: Number.isFinite(total) ? total : 0,
    actual1688OrderShippingFee: Number.isFinite(shippingFee) ? shippingFee : 0,
  };
};

export const get1688TrackingStatus = async (orderId) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.logistics/alibaba.trade.getLogisticsTraceInfo.buyerView/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    webSite: "1688",
    orderId: `${orderId}`,
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.logistics/alibaba.trade.getLogisticsTraceInfo.buyerView/9077165`,
    qs.stringify({
      webSite: "1688",
      orderId: `${orderId}`,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (resultObj && resultObj.data && resultObj.data.logisticsTrace) {
    return resultObj.data.logisticsTrace;
  } else {
    return null;
  }
};

// Holds the raw API error from the most recent generate1688PaymentLink call,
// so callers can inspect which order(s) caused the failure (e.g. orderIdList
// mentioned inside erroMsg) without changing the function's string|null return type.
export let lastPaymentLinkError = null;

export const generate1688PaymentLink = async (orderIdList) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath = "param2/1/com.alibaba.trade/alibaba.alipay.url.get/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    orderIdList: JSON.stringify(orderIdList),
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.trade/alibaba.alipay.url.get/9077165`,
    qs.stringify({
      orderIdList: JSON.stringify(orderIdList),
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  if (resultObj && resultObj.data && resultObj.data.payUrl) {
    lastPaymentLinkError = null;
    return resultObj.data.payUrl;
  } else {
    console.error(
      "generate1688PaymentLink failed. Full response:",
      JSON.stringify(resultObj.data),
    );
    lastPaymentLinkError = resultObj.data || null;
    return null;
  }
};
let totalCategoryFetched = 0;
let totalUploaded = 0;
export const get1688Categories = async (categoryId) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.fenxiao.crossborder/category.translation.getById/9077165";

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    language: "en",
    categoryId,
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  let resultObj = await Axios.post(
    `https://gw.open.1688.com/openapi/param2/1/com.alibaba.fenxiao.crossborder/category.translation.getById/9077165`,
    qs.stringify({
      language: "en",
      categoryId: categoryId,
      access_token: access_token,
      _aop_signature: signature,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log(resultObj);

  console.log(resultObj.data);
  console.log(resultObj.data.result.result);
  if (!resultObj?.data?.result?.result?.children) {
    return;
  }

  const children = resultObj.data.result.result.children;

  for (let child of children) {
    if (child.level == 1) {
      await upload1688Category(child);
    } else if (child.level == 2) {
      await addToRootCategory(child);
    } else if (child.level == 3) {
      await level3Category(child);
    }
  }
  for (let child of children) {
    await get1688Categories(child.categoryId, child.parentCateId); // recursive call
  }
  console.log(`total category fetched: ${totalCategoryFetched}`);
  console.log(`total uploaded: ${totalUploaded}`);
};
// Holds the raw error from the most recent create1688Order call (either the raw
// 1688 API error payload, or a client-side validation/network error), so callers
// can surface exactly why an order failed instead of silently marking it Picked.
export let lastCreateOrderError = null;

export const create1688Order = async (orderObj, addressId) => {
  // === Setup Required Values ===
  let appSecret = "U1IH8T6UoQxf";
  let access_token = "793b6857-359d-494b-bc2b-e3b37bc87c12";

  // === URI path for this specific API ===
  let uriPath =
    "param2/1/com.alibaba.trade/alibaba.trade.createCrossOrder/9077165";

  // Fail fast if any sku has no spec_id: sending `specId: "undefined"` to 1688
  // gets rejected with SPEC_NO_EXIST, and there's no safe way to guess a valid
  // spec for a product that genuinely has none.
  for (const item of orderObj.items) {
    for (const sku of item.skus) {
      if (!sku.spec_id) {
        lastCreateOrderError = {
          code: "CLIENT_MISSING_SPEC_ID",
          message: `Item "${item.name}" (offerId ${item.id}) has no valid 1688 product spec (spec_id). Fix this product's data before it can be ordered.`,
          offerId: item.id,
        };
        return null;
      }
    }
  }

  // De-duplicate (offerId, specId) pairs, summing quantity, since 1688 rejects
  // a cargoParamList containing a literal duplicate entry.
  const cargoByKey = {};
  orderObj.items.map((item) => {
    item.skus.map((sku) => {
      const key = `${item.id}|${sku.spec_id}`;
      if (cargoByKey[key]) {
        cargoByKey[key].quantity = `${
          parseFloat(cargoByKey[key].quantity) + parseFloat(sku.totalQuantity)
        }`;
      } else {
        cargoByKey[key] = {
          offerId: `${item.id}`,
          specId: `${sku.spec_id}`,
          quantity: `${sku.totalQuantity}`,
        };
      }
    });
  });
  let cargoParamList = Object.values(cargoByKey);

  console.log(cargoParamList);

  // === Construct parameters object (use exact field names from request body) ===
  let params = {
    access_token: access_token,
    flow: "general",
    addressParam: JSON.stringify({ addressId: `${addressId}` }),
    cargoParamList: JSON.stringify(cargoParamList),
  };

  // === Sort parameters alphabetically by key ===
  let keys = Object.keys(params).sort();
  let paramStr = "";
  keys.forEach(function (key) {
    paramStr += key + params[key];
  });

  // === Combine uriPath + sorted param string ===
  let stringToSign = uriPath + paramStr;

  console.log("String to Sign:", stringToSign);

  // === HMAC-SHA1 with App Secret ===
  let hash = CryptoJS.HmacSHA1(stringToSign, appSecret);

  // === Final Signature in UPPERCASE Hex ===
  let signature = hash.toString(CryptoJS.enc.Hex).toUpperCase();

  console.log("Generated _aop_signature:", signature);

  try {
    let resultObj = await Axios.post(
      `https://gw.open.1688.com/openapi/param2/1/com.alibaba.trade/alibaba.trade.createCrossOrder/9077165`,
      qs.stringify({
        flow: "general",
        addressParam: JSON.stringify({ addressId: `${addressId}` }),
        cargoParamList: JSON.stringify(cargoParamList),
        access_token: access_token,
        _aop_signature: signature,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    console.log(resultObj);

    console.log(resultObj.data);
    if (resultObj && resultObj.data && resultObj.data.result) {
      lastCreateOrderError = null;
      return resultObj.data.result;
    } else {
      lastCreateOrderError = resultObj.data || {
        code: "UNKNOWN",
        message: "1688 returned an unexpected response.",
      };
      return null;
    }
  } catch (err) {
    console.error("create1688Order failed", err);
    lastCreateOrderError = {
      code: "NETWORK_ERROR",
      message: err?.message || "Failed to reach 1688 (network error).",
    };
    return null;
  }
};
