import firebase from "firebase/app";
import { dhakaDayStart, dhakaDayEnd } from "../constants/dateRange";
import { parseRmb as parseRmbValue } from "../constants/productRequestPayment";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

// paicart firebase connect
const firebaseConfig = {
  apiKey: "AIzaSyDOUWPHR3NANUmQ6IDrehAe-Gx9hwyJ2Bc",
  authDomain: "paicart.firebaseapp.com",
  projectId: "paicart",
  storageBucket: "paicart.appspot.com",
  messagingSenderId: "702286683439",
  appId: "1:702286683439:web:1e188b457e5cdec99ed5da",
  measurementId: "G-2HHC4V5M6Y",
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();

export const createAdminProfileDocument = async (userAuth, additionalData) => {
  if (!userAuth) return;

  const adminRef = firestore.doc(`admins/${userAuth.uid}`);

  const snapShot = await adminRef.get();
  if (!snapShot.exists) {
    const { name, email } = userAuth;
    const createdAt = new Date();
    try {
      await adminRef.set({
        name,
        email,
        createdAt,
        pending_orders: [],
        balance: 0,
        used_balance: 0,
        successfully_delivered_orders: [],
        remaining_balance: 0,
        ...additionalData,
      });
    } catch (error) {
      console.log("error creating admin", error.message);
    }
  }
  return adminRef;
};
export const updateAllUser = async () => {
  const usersRef = firestore.collection("users");
  const users = await usersRef.get();

  users.forEach(async (doc) => {
    const userRef = firestore.doc(`users/${doc.id}`);
    const user = await userRef.get();
    // do any updates here
  });
};
export const uploadImage = async (file) => {
  const imageRef = storage.ref(`products/${file.name}`);

  await imageRef.put(file);
  var imgUrl = [];
  await imageRef.getDownloadURL().then((url) => {
    console.log(url);
    imgUrl.push(url);
  });
  // var uploadTask = imageRef.put(file)
  // uploadTask.on('state_changed',
  // (snapShot)=>{
  //   var progress = (snapShot.bytesTransferred / snapShot.totalBytes) * 100;
  //   // alert(`upload is ${progress}% done`)
  // },
  // (error)=>{
  //   alert(error)
  // },
  // ()=>{
  //   // alert('successfully uploaded the file')
  //   imageRef.getDownloadURL().then((url)=>{
  //     imgUrl.push(url)
  //     console.log(imgUrl[0])
  //   }).catch((error)=>alert(error))
  // })

  return imgUrl[0];
};
export const uploadProduct = async (productObj, discount) => {
  const productRef = firestore.doc(`products/${productObj.id}`);
  const snapShot = await productRef.get();
  delete productObj.file;
  const newProductObj = {
    ...productObj,
    new: productObj.new === "true" ? true : false,
    sale: productObj.sale === "true" ? true : false,
  };
  if (!snapShot.exists) {
    try {
      productRef.set({
        ...newProductObj,
        discount: discount,
      });
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a product with this given prodcut Id, please change the product Id and upload again",
    );
  }
};
export const uploadProductTax = async (productObj) => {
  const productRef = firestore.doc(`taxes/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj };
  if (!snapShot.exists) {
    try {
      productRef.set({
        ...newProductObj,
      });
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a product with this given prodcut Id, please change the product Id and upload again",
    );
  }
};
export const uploadAliProduct = async (productObj) => {
  const productRef = firestore.doc(`aliproducts/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj };
  if (!snapShot.exists) {
    try {
      productRef.set({
        ...newProductObj,
      });
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "this product is already added to your website. try adding different product",
    );
  }
};
let totalUploaded = 0;
export const upload1688Category = async (category) => {
  const productRef = firestore.doc(`1688Category/${category.categoryId}`);
  const snapShot = await productRef.get();

  if (!snapShot.exists) {
    try {
      productRef.set({
        ...category,
        level1: firebase.firestore.FieldValue.arrayUnion(category.categoryId),
      });
      totalUploaded += 1;
      console.log(`total parent uploaded ${totalUploaded}`);
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "this product is already added to your website. try adding different product",
    );
  }
};
export const addToRootCategory = async (category) => {
  const productRef = firestore.doc(`1688Category/${category.parentCateId}`);
  const snapShot = await productRef.get();

  if (snapShot.exists) {
    try {
      productRef.update({
        level2: firebase.firestore.FieldValue.arrayUnion(category.categoryId),
      });
      totalUploaded += 1;
      console.log(`total level2 uploaded including parent ${totalUploaded}`);
    } catch (error) {
      alert(error);
    }
  }
};
export const level3Category = async (category) => {
  const querySnapshot = await firestore
    .collection("1688Category")
    .where("level2", "array-contains", category.parentCateId)
    .get();

  for (let doc of querySnapshot.docs) {
    await doc.ref.update({
      level3: firebase.firestore.FieldValue.arrayUnion(category.categoryId),
    });
  }
  totalUploaded += 1;
  console.log(`total level3 uploaded including parent ${totalUploaded}`);
};
export const deleteAliProductsCollection = async () => {
  const collectionRef = firestore.collection(`aliproducts`);
  const products = await collectionRef.get();
  products.forEach(async (doc) => {
    const productRef = firestore.doc(`aliproducts/${doc.data().id}`);
    await productRef.delete();
  });
};

export const getAllProducts = async () => {
  const productsCollectionRef = firestore.collection("products");
  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllProductsTax = async () => {
  const productsCollectionRef = firestore.collection("taxes");
  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllAliProducts = async () => {
  const aliProductsCollectionRef = firestore.collection("aliproducts");
  try {
    const products = await aliProductsCollectionRef.get();
    const aliProductsArray = [];
    products.forEach((doc) => {
      aliProductsArray.push(doc.data());
    });
    return aliProductsArray;
  } catch (error) {
    alert(error);
  }
};

export const deleteProduct = async (id) => {
  const productRef = firestore.doc(`aliproducts/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const deleteProductTax = async (id) => {
  const productRef = firestore.doc(`taxes/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const updateProductTax = async (productObj) => {
  const productRef = firestore.doc(`taxes/${productObj.id}`);
  try {
    await productRef.update({ ...productObj });
  } catch (error) {
    alert(error);
  }
};
export const updateExecutionTime = async () => {
  const productRef = firestore.doc(`DailyFunction/called`);
  try {
    if ((await productRef.get()).exists) {
      await productRef.update({ lastExecution: new Date().toISOString() });
    } else {
      await productRef.set({ lastExecution: new Date().toISOString() });
    }
  } catch (error) {
    alert(error);
  }
};
export const getExecutionTime = async () => {
  const productRef = firestore.doc(`DailyFunction/called`);
  try {
    let product = await productRef.get();
    return product.data();
  } catch (error) {
    alert(error);
    return null;
  }
};

export const getSingleProductTax = async (id) => {
  const productRef = firestore.doc(`taxes/${id}`);
  try {
    const product = await productRef.get();
    return product.data();
  } catch (error) {
    alert(error);
  }
};
export const getSingleUser = async (id) => {
  const userRef = firestore.doc(`users/${id}`);
  try {
    const user = await userRef.get();
    return user.data();
  } catch (error) {
    alert(error);
  }
};

export const getSingleCarton = async (id) => {
  const cartonRef = firestore.doc(`cartons/${id}`);
  try {
    const carton = await cartonRef.get();
    return carton.data();
  } catch (error) {
    alert(error);
  }
};
export const getSingleEmployee = async (id) => {
  const employeeRef = firestore.doc(`employees/${id}`);
  try {
    const employee = await employeeRef.get();
    return employee.data();
  } catch (error) {
    alert(error);
  }
};

export const getSingleProduct = async (id) => {
  const productRef = firestore.doc(`products/${id}`);
  try {
    const product = await productRef.get();
    if (!product.exists) {
      const aliProductRef = firestore.doc(`aliproducts/${id}`);
      try {
        const aliProduct = await aliProductRef.get();
        var originalPrice = [];
        if (
          aliProduct.data().originalPrice.min ==
          aliProduct.data().originalPrice.max
        ) {
          originalPrice.push(
            Math.round(aliProduct.data().originalPrice.min * 90),
          );
        } else {
          originalPrice.push(
            `${Math.round(
              aliProduct.data().originalPrice.min * 90,
            )}- ${Math.round(aliProduct.data().originalPrice.max * 90)}`,
          );
        }
        var salePrice = [];
        if (
          aliProduct.data().salePrice.min == aliProduct.data().salePrice.max
        ) {
          salePrice.push(Math.round(aliProduct.data().salePrice.min * 90));
        } else {
          salePrice.push(
            `${Math.round(aliProduct.data().salePrice.min * 90)}- ${Math.round(
              aliProduct.data().salePrice.max * 90,
            )}`,
          );
        }
        const aliProductObj = {
          id: aliProduct.data().productId,
          name: aliProduct.data().title,
          price: originalPrice[0],
          salePrice: salePrice[0],
          pictures: [...aliProduct.data().images],
          availability: aliProduct.data().availability,
          rating: aliProduct.data().ratings.averageStar,
          categoryId: aliProduct.data().categoryId,
          description: aliProduct.data().description,
          specs: aliProduct.data().specs,
          feedback: aliProduct.data().feedback,
          orders: aliProduct.data().orders,
          totalAvailableQuantity: aliProduct.data().totalAvailableQuantity,
          variants: aliProduct.data().variants,
        };
        return aliProductObj;
      } catch (error) {
        alert(error);
      }
    } else {
      return product.data();
    }
  } catch (error) {
    alert(error);
  }
};

export const approveExpense = async (expense) => {
  const batch = firestore.batch();
  const expenseRef = firestore.doc(`dailyExpenses/${expense.id}`);

  // Get the expense document snapshot
  const expenseSnapShot = await expenseRef.get();
  console.log(expenseSnapShot.data());

  // Get references to related documents
  const categoryMonthlyExpenseRef = firestore.doc(
    `categoryMonthlyExpense/${expenseSnapShot.data().month}-${
      expenseSnapShot.data().category
    }-${expenseSnapShot.data().subCategory.replaceAll("/", "_")}`,
  );
  const monthlyExpenseRef = firestore.doc(
    `monthlyExpense/${expenseSnapShot.data().month}`,
  );

  // Get document snapshots
  const categoryMonthlyExpenseSnapShot = await categoryMonthlyExpenseRef.get();
  const monthlyExpenseSnapShot = await monthlyExpenseRef.get();

  // Update expense status
  batch.update(expenseRef, { status: "approved" });

  // Update related documents based on expense category
  if (expenseSnapShot.data().category === "SALARY") {
    const monthlySalaryRef = firestore.doc(
      `monthlySalary/${expenseSnapShot.data().month}`,
    );
    const monthlySalarySnapShot = await monthlySalaryRef.get();
    if (monthlySalarySnapShot.exists) {
      batch.update(monthlySalaryRef, {
        amount:
          parseInt(monthlySalarySnapShot.data().amount) +
          parseInt(expenseSnapShot.data().amount),
      });
    } else {
      batch.set(monthlySalaryRef, {
        month: expenseSnapShot.data().month,
        amount: parseInt(expenseSnapShot.data().amount),
      });
    }
  } else if (
    expenseSnapShot.data().category === "LOAN" ||
    expenseSnapShot.data().category === "MONTHLY INSTALLMENT"
  ) {
    const customerRef = firestore.doc(
      `${
        expenseSnapShot.data().category === "LOAN"
          ? "customerLoans"
          : "customerInstallments"
      }/${expenseSnapShot.data().uid}`,
    );
    const customerSnapShot = await customerRef.get();
    if (customerSnapShot.exists) {
      batch.update(customerRef, {
        amount:
          parseInt(customerSnapShot.data().amount) +
          parseInt(expenseSnapShot.data().amount),
        customer: expenseSnapShot.data().subCategory,
      });
    } else {
      batch.set(customerRef, {
        customer: expenseSnapShot.data().subCategory,
        amount: parseInt(expenseSnapShot.data().amount),
        uid: expenseSnapShot.data().uid,
      });
    }
  }

  // Update categorywise monthly expense
  if (categoryMonthlyExpenseSnapShot.exists) {
    if (expenseSnapShot.data().category == "SALARY") {
      batch.update(categoryMonthlyExpenseRef, {
        amount:
          parseInt(categoryMonthlyExpenseSnapShot.data().amount) +
          parseInt(expenseSnapShot.data().amount),
        paid:
          categoryMonthlyExpenseSnapShot.data().salary ==
          parseInt(categoryMonthlyExpenseSnapShot.data().amount) +
            parseInt(expenseSnapShot.data().amount)
            ? true
            : false,
      });
    } else {
      batch.update(categoryMonthlyExpenseRef, {
        amount:
          parseInt(categoryMonthlyExpenseSnapShot.data().amount) +
          parseInt(expenseSnapShot.data().amount),
      });
    }
  } else {
    batch.set(categoryMonthlyExpenseRef, {
      id: `${expenseSnapShot.data().month}-${expenseSnapShot.data().category}-${
        expenseSnapShot.data().subCategory
      }`,
      amount: parseInt(expenseSnapShot.data().amount),
      category: expenseSnapShot.data().category,
      subCategory: expenseSnapShot.data().subCategory,
      month: expenseSnapShot.data().month,
      paid: false,
      salary: 0,
    });
  }

  // Update monthly expense
  if (monthlyExpenseSnapShot.exists) {
    batch.update(monthlyExpenseRef, {
      amount:
        parseInt(monthlyExpenseSnapShot.data().amount) +
        parseInt(expenseSnapShot.data().amount),
    });
  } else {
    batch.set(monthlyExpenseRef, {
      id: `${expenseSnapShot.data().month}`,
      amount: parseInt(expenseSnapShot.data().amount),
    });
  }

  // Commit the batch
  try {
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error approving expense:", error);
    return false;
  }
};

export const deleteExpense = async (expenseId) => {
  const expenseRef = firestore.doc(`dailyExpenses/${expenseId}`);
  const snapShot = await expenseRef.get();
  console.log(snapShot.data());
  try {
    await expenseRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const handleSourcingAgentPay = async (sourcingObj) => {
  const batch = firestore.batch();
  const sourcingRef = firestore.doc(`sourcing/${sourcingObj.id}`);
  const expenseRef = firestore.doc(`dailyExpenses/${sourcingObj.paymentId}`);

  // Get document snapshots
  const sourcingSnapShot = await sourcingRef.get();
  const expenseSnapShot = await expenseRef.get();

  // Create expense document if it doesn't exist
  if (!expenseSnapShot.exists) {
    try {
      batch.set(expenseRef, {
        amount: parseInt(sourcingObj.agentPaid),
        category: "Sourcing",
        subCategory: `${sourcingObj.agent}(agent %)`,
        note: `Invoice:${sourcingObj.id}
          Date: ${sourcingSnapShot.data().date}`,
        date: sourcingObj.date,
        id: sourcingObj.paymentId,
        month: sourcingObj.month,
        receiveBy: sourcingObj.receiveBy,
        status: "pending",
        unEditable: true,
      });

      batch.update(sourcingRef, {
        agentPays: sourcingObj.agentPays,
        agentPaid: sourcingSnapShot.data().agentPaid
          ? parseInt(sourcingSnapShot.data().agentPaid) +
            parseInt(sourcingObj.agentPaid)
          : parseInt(sourcingObj.agentPaid),
        status: "approved",
        algProfit:
          parseInt(sourcingSnapShot.data().totalPaid) -
          (parseInt(sourcingSnapShot.data().buyingCost) +
            (parseInt(sourcingSnapShot.data().agentPaid) +
              parseInt(sourcingObj.agentPaid))),
      });
    } catch (error) {
      alert(error);
    }
  }

  // Commit the batch
  try {
    await batch.commit();
    const sourcingRef = firestore.doc(`sourcing/${sourcingObj.id}`);
    const snapShot = await sourcingRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
    return false;
  }
};

export const getAllCnfExpenses = async (month, name) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("month", "==", month)
    .where("subCategory", "==", name);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllPartnerCashIn = async (partnerId) => {
  const expensesCollectionRef = firestore
    .collection("dailyCashIn")
    .where("partnerId", "==", partnerId);

  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllCnfExpensesAllMonths = async (name) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("subCategory", "==", name);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const updateEmployee = async (employeeObj) => {
  const employeeRef = firestore.doc(`employees/${employeeObj.employeeId}`);
  try {
    await employeeRef.update({ ...employeeObj });
    const snapShot = await employeeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const uploadEmployee = async (employeeObj) => {
  const employeeRef = firestore.doc(`employees/${employeeObj.employeeId}`);
  const snapShot = await employeeRef.get();
  if (!snapShot.exists) {
    try {
      await employeeRef.set({
        ...employeeObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await employeeRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a employee with similar name, please change the name and try again",
    );
  }
};

export const getAllCashIns = async (day) => {
  const expensesCollectionRef = firestore
    .collection("dailyCashIn")
    .where("date", "==", day);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const updateAdminStatus = async (adminObj) => {
  const adminRef = firestore.doc(`admins/${adminObj.adminId}`);
  try {
    const snapShot = await adminRef.get();
    console.log(snapShot.data());
    await adminRef.update({
      status: adminObj.status,
    });
    const updatedSnapShot = await adminRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const createMonth = async () => {
  const date = new Date();
  const monthRef = firestore.doc(`months/${getMonthName()}`);
  const month = await monthRef.get();
  if (month.exists) {
    let monthsArray = [];
    const monthsCollectionRef = firestore.collection("months");
    const monthsCollection = await monthsCollectionRef.get();
    monthsCollection.forEach((doc) => {
      monthsArray.push(doc.data());
    });
    return monthsArray;
  } else {
    await monthRef.set({
      month: getMonthName(),
    });
    let monthsArray = [];
    const monthsCollectionRef = firestore.collection("months");
    const monthsCollection = await monthsCollectionRef.get();
    monthsCollection.forEach((doc) => {
      monthsArray.push(doc.data());
    });
    return monthsArray;
  }
};

export const getAllFunds = async () => {
  const expensesCollectionRef = firestore
    .collection(`dailyExpenses`)
    .where("category", "==", "FUND");

  const cashInCollectionRef = firestore
    .collection(`dailyCashIn`)
    .where("category", "==", "FUND");

  try {
    const expenses = await expensesCollectionRef.get();
    const cashIns = await cashInCollectionRef.get();
    const expensesArray = [];
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push({ ...doc.data(), type: "cashIn" });
    });
    expenses.forEach((doc) => {
      expensesArray.push({ ...doc.data(), type: "expense" });
    });
    let mergedArray = [...expensesArray, ...cashInsArray];
    return mergedArray.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  } catch (error) {
    alert(error);
  }
};
export const updateSalary = async (employee) => {
  const categoryMonthlyExpenseRef = firestore.doc(
    `categoryMonthlyExpense/${employee.id}`,
  );
  const categoryMonthlyExpnese = await categoryMonthlyExpenseRef.get();
  await categoryMonthlyExpenseRef.update({
    ...categoryMonthlyExpnese.data(),
    salary: employee.salary,
  });
  const updatedSnapShot = await categoryMonthlyExpenseRef.get();
  return updatedSnapShot.data();
};
export const getAllSourcingsAgent = async (agent, month) => {
  const sourcingsCollectionRef = firestore
    .collection("sourcing")
    .where("agent", "==", agent)
    .where("month", "==", month);
  try {
    const sourcings = await sourcingsCollectionRef.get();
    const sourcingsArray = [];
    sourcings.forEach((doc) => {
      sourcingsArray.push(doc.data());
    });
    return sourcingsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllSourcings = async (month) => {
  const sourcingsCollectionRef = firestore
    .collection("sourcing")
    .where("month", "==", month);
  try {
    const sourcings = await sourcingsCollectionRef.get();
    const sourcingsArray = [];
    sourcings.forEach((doc) => {
      sourcingsArray.push(doc.data());
    });
    return sourcingsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllExpenses = async (day) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("date", "==", day);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllMonthlyExpense = async () => {
  const expensesCollectionRef = firestore.collection("monthlyExpense");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllPendingExpenses = async () => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("status", "==", "pending");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllTransactions = async (employeeId, month) => {
  const employeesCollectionRef = firestore
    .collection("transactions")
    .where("employeeId", "==", employeeId)
    .where("month", "==", month);
  try {
    const employees = await employeesCollectionRef.get();
    const employeesArray = [];
    employees.forEach((doc) => {
      employeesArray.push(doc.data());
    });
    return employeesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllPendingExpensesByDay = async (day) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("date", "==", day)
    .where("status", "==", "pending");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllPendingCashInByDay = async (day) => {
  const cashInsCollectionRef = firestore
    .collection("dailyCashIn")
    .where("date", "==", day)
    .where("status", "==", "pending");
  try {
    const cashIns = await cashInsCollectionRef.get();
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push(doc.data());
    });
    return cashInsArray;
  } catch (error) {
    alert(error);
  }
};

export const getMonth = async (employee, month) => {
  const expensesCollectionRef = firestore
    .collection(`categoryMonthlyExpense`)
    .where("category", "==", "SALARY")
    .where("subCategory", "==", employee);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });

    const unPaidMonths = expensesArray.filter((expense) => !expense.paid);
    return unPaidMonths;
  } catch (error) {
    alert(error);
  }
};

export const getSingleCashSummary = async () => {
  const date = new Date();
  const cashSummaryRef = firestore.doc(
    `cashSummary/${date.toLocaleDateString("en-GB").replaceAll("/", "-")}`,
  );
  const cashSummary = await cashSummaryRef.get();
  if (cashSummary.exists) {
    return cashSummary.data();
  } else {
    let lastDay;
    for (let i = 0; i < 365; i++) {
      let [day, month, year] = date.toLocaleDateString("en-GB").split("/");
      let dateObj = new Date(year, parseInt(month - 1), day - i);
      let previousDate = new Date(dateObj.getTime().toString() - 86400000);
      const previousDayRef = firestore.doc(
        `cashSummary/${previousDate
          .toLocaleDateString("en-GB")
          .replaceAll("/", "-")}`,
      );
      const previouseDay = await previousDayRef.get();
      if (previouseDay.exists) {
        lastDay = previouseDay.data();
        break;
      }
    }
    console.log(lastDay);
    await cashSummaryRef.set({
      month: getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      previousCash:
        lastDay && lastDay.remainingBalance
          ? parseInt(lastDay.remainingBalance)
          : 0,
      totalCashIns: 0,
      totalCashOuts: 0,
      remainingBalance:
        lastDay && lastDay.remainingBalance
          ? parseInt(lastDay.remainingBalance)
          : 0,
    });
    const updatedSnapShot = await cashSummaryRef.get();
    return updatedSnapShot.data();
  }
};

export const getSingleMonthlyExpense = async (month) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("month", "==", month);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const updateExpense = async (expenseObj) => {
  const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
  try {
    await expenseRef.update({ ...expenseObj });
    const snapShot = await expenseRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const updateCashIn = async (cashInObj) => {
  const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
  try {
    await cashInRef.update({ ...cashInObj });
    const snapShot = await cashInRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const uploadExpense = async (expenseObj) => {
  const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
  const snapShot = await expenseRef.get();
  if (!snapShot.exists) {
    try {
      await expenseRef.set({
        ...expenseObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await expenseRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a expense with similar id,try again later");
  }
};

export const getMonthName = () => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const d = new Date();
  return `${monthNames[d.getMonth()]},${d.getFullYear()}`;
};

export const deleteOffice = async (officeId) => {
  const officeRef = firestore.doc(`offices/${officeId}`);
  const snapShot = await officeRef.get();
  console.log(snapShot.data());
  try {
    await officeRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const deletePromotion = async (officeId) => {
  const officeRef = firestore.doc(`promotions/${officeId}`);
  const snapShot = await officeRef.get();
  console.log(snapShot.data());
  try {
    await officeRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const deleteCarton = async (cartonId) => {
  const cartonRef = firestore.doc(`cartons/${cartonId}`);
  const snapShot = await cartonRef.get();
  console.log(snapShot.data());
  try {
    await cartonRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getAllCnfs = async () => {
  const cnfsCollectionRef = firestore.collection("cnfs");
  try {
    const cnfs = await cnfsCollectionRef.get();
    const cnfsArray = [];
    cnfs.forEach((doc) => {
      cnfsArray.push(doc.data());
    });
    return cnfsArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllOffices = async () => {
  const officesCollectionRef = firestore.collection("offices");
  try {
    const offices = await officesCollectionRef.get();
    const officesArray = [];
    offices.forEach((doc) => {
      officesArray.push(doc.data());
    });
    return officesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllPromotions = async () => {
  const officesCollectionRef = firestore.collection("promotions");
  try {
    const offices = await officesCollectionRef.get();
    const officesArray = [];
    offices.forEach((doc) => {
      officesArray.push(doc.data());
    });
    return officesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllCartons = async (country) => {
  const cartonsCollectionRef = firestore
    .collection("cartons")
    .where("bd", "==", country);
  try {
    const cartons = await cartonsCollectionRef.get();
    const cartonsArray = [];
    cartons.forEach((doc) => {
      cartonsArray.push(doc.data());
    });
    return cartonsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllCartonBooking = async () => {
  const cartonsCollectionRef = firestore
    .collection("cartonBookings")
    .orderBy("createdAt", "desc")
    .limit(50);

  try {
    const cartons = await cartonsCollectionRef.get();
    const cartonsArray = [];
    cartons.forEach((doc) => {
      cartonsArray.push(doc.data());
    });
    return cartonsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllCnCartons = async () => {
  const cartonsCollectionRef = firestore
    .collection("cartons")
    .where("bd", "==", false)
    .where("lotNo", "==", "");
  try {
    const cartons = await cartonsCollectionRef.get();
    const cartonsArray = [];
    cartons.forEach((doc) => {
      cartonsArray.push(doc.data());
    });
    return cartonsArray;
  } catch (error) {
    alert(error);
  }
};

export const updateOffice = async (officeObj) => {
  const officeRef = firestore.doc(`offices/${officeObj.officeId}`);
  try {
    await officeRef.update({ ...officeObj });
    const snapShot = await officeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const updatePromotion = async (officeObj) => {
  const officeRef = firestore.doc(`promotions/${officeObj.officeId}`);
  try {
    await officeRef.update({ ...officeObj });
    const snapShot = await officeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const uploadCashIn = async (cashInObj) => {
  const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
  const snapShot = await cashInRef.get();
  if (!snapShot.exists) {
    try {
      await cashInRef.set({
        ...cashInObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await cashInRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a cash in with similar id,try again later");
  }
};

export const uploadOffice = async (officeObj) => {
  const officeRef = firestore.doc(`offices/${officeObj.officeId}`);
  const snapShot = await officeRef.get();
  if (!snapShot.exists) {
    try {
      await officeRef.set({
        ...officeObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await officeRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a office with similar name, please change the country name and try again",
    );
  }
};
export const uploadPromotion = async (officeObj) => {
  const officeRef = firestore.doc(`promotions/${officeObj.officeId}`);
  const snapShot = await officeRef.get();
  if (!snapShot.exists) {
    try {
      await officeRef.set({
        ...officeObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await officeRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a office with similar name, please change the country name and try again",
    );
  }
};
export const uploadCarton = async (cartonObj) => {
  const cartonRef = firestore.doc(`cartons/${cartonObj.cartonId}`);
  const snapShot = await cartonRef.get();
  if (!snapShot.exists) {
    try {
      await cartonRef.set({
        ...cartonObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await cartonRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a carton with similar name, please change the country name and try again",
    );
  }
};
export const uploadCartonBooking = async (cartonObj) => {
  let id = new Date().getTime().toString();
  const cartonRef = firestore.doc(`cartonBookings/${id}`);
  const snapShot = await cartonRef.get();
  if (!snapShot.exists) {
    try {
      await cartonRef.set({
        ...cartonObj,
        id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await cartonRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a carton with similar name, please change the country name and try again",
    );
  }
};
export const updateCarton = async (cartonObj) => {
  const cartonRef = firestore.doc(`cartons/${cartonObj.cartonId}`);
  const snapShot = await cartonRef.get();

  try {
    await cartonRef.update({
      ...cartonObj,
      hasProducts: true,
    });
    console.log(snapShot.data());
    const uploadedSnapShot = await cartonRef.get();
    return uploadedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteCashIn = async (cashId) => {
  const cashInRef = firestore.doc(`dailyCashIn/${cashId}`);
  const snapShot = await cashInRef.get();
  console.log(snapShot.data());
  try {
    await cashInRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const deleteEmployee = async (employeeId) => {
  const employeeRef = firestore.doc(`employees/${employeeId}`);
  const snapShot = await employeeRef.get();
  console.log(snapShot.data());
  try {
    await employeeRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const getAllCustomerLoans = async () => {
  const usersCollectionRef = firestore.collection("customerLoans");
  try {
    const users = await usersCollectionRef.get();
    const usersArray = [];
    users.forEach((doc) => {
      // console.log(doc.id, " => ", doc.data());
      usersArray.push({ uid: doc.id, ...doc.data() });
    });
    return usersArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllCustomerInstallments = async () => {
  const usersCollectionRef = firestore.collection("customerInstallments");
  try {
    const users = await usersCollectionRef.get();
    const usersArray = [];
    users.forEach((doc) => {
      // console.log(doc.id, " => ", doc.data());
      usersArray.push({ uid: doc.id, ...doc.data() });
    });
    return usersArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllDocumentExpressRates = async () => {
  const expressRatesDocumentsCollectionRef = firestore.collection(
    "expressRatesDocuments",
  );
  try {
    const expressRatesDocuments =
      await expressRatesDocumentsCollectionRef.get();
    const expressRatesDocumentsArray = [];
    expressRatesDocuments.forEach((doc) => {
      expressRatesDocumentsArray.push(doc.data());
    });
    return expressRatesDocumentsArray;
  } catch (error) {
    alert(error);
  }
};

export const approveCashIn = async (expense) => {
  const batch = firestore.batch();
  const expenseRef = firestore.doc(`dailyCashIn/${expense.id}`);

  // Get the expense document snapshot
  const expenseSnapShot = await expenseRef.get();
  console.log(expenseSnapShot.data());

  // Get references to related documents
  const monthlyExpenseRef = firestore.doc(
    `monthlyCashIn/${expenseSnapShot.data().month}`,
  );

  // Get document snapshots
  const monthlyExpenseSnapShot = await monthlyExpenseRef.get();

  // Update expense status
  batch.update(expenseRef, { status: "approved" });

  // Update related documents based on expense category
  if (expenseSnapShot.data().category === "LOAN") {
    const customerRef = firestore.doc(
      `customerLoans/${expenseSnapShot.data().uid}`,
    );
    const customerSnapShot = await customerRef.get();
    if (customerSnapShot.exists) {
      batch.update(customerRef, {
        amount:
          parseInt(customerSnapShot.data().amount) -
          parseInt(expenseSnapShot.data().amount),
        customer: expenseSnapShot.data().subCategory,
      });
    } else {
      batch.set(customerRef, {
        customer: expenseSnapShot.data().subCategory,
        amount: -parseInt(expenseSnapShot.data().amount),
        uid: expenseSnapShot.data().uid,
      });
    }
  } else if (expenseSnapShot.data().category === "INVEST") {
    const categoryMonthlyExpenseRef = firestore.doc(
      `categoryMonthlyExpense/${expenseSnapShot.data().month}-${
        expenseSnapShot.data().category
      }-${expenseSnapShot.data().subCategory.replaceAll("/", "_")}`,
    );
    const categoryMonthlyExpenseSnapShot =
      await categoryMonthlyExpenseRef.get();
    if (categoryMonthlyExpenseSnapShot.exists) {
      batch.update(categoryMonthlyExpenseRef, {
        amount:
          parseInt(categoryMonthlyExpenseSnapShot.data().amount) -
          parseInt(expenseSnapShot.data().amount),
      });
    } else {
      batch.set(categoryMonthlyExpenseRef, {
        id: `${expenseSnapShot.data().month}-${
          expenseSnapShot.data().category
        }-${expenseSnapShot.data().subCategory}`,
        amount: -parseInt(expenseSnapShot.data().amount),
        category: expenseSnapShot.data().category,
        subCategory: expenseSnapShot.data().subCategory,
        month: expenseSnapShot.data().month,
        paid: false,
        salary: 0,
      });
    }
  } else if (expenseSnapShot.data().category === "PARTNER") {
    const adminRef = firestore.doc(
      `admins/${expenseSnapShot.data().partnerId}`,
    );
    const adminSnapShot = await adminRef.get();
    if (adminSnapShot.exists) {
      batch.update(adminRef, {
        balance:
          parseInt(adminSnapShot.data().balance) +
          parseInt(expenseSnapShot.data().amount),
      });
    }
  }

  // Update monthly expense
  if (monthlyExpenseSnapShot.exists) {
    batch.update(monthlyExpenseRef, {
      amount:
        parseInt(monthlyExpenseSnapShot.data().amount) +
        parseInt(expenseSnapShot.data().amount),
    });
  } else {
    batch.set(monthlyExpenseRef, {
      id: `${expenseSnapShot.data().month}`,
      amount: parseInt(expenseSnapShot.data().amount),
    });
  }

  // Commit the batch
  try {
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error approving cash-in:", error);
    return false;
  }
};

export const updateCashSummaryCashOut = async (cashOutMonth, date, total) => {
  const [day, month, year] = date.split("/");
  let today = new Date();
  let expenseDate = new Date(year, parseInt(month - 1), day);

  const diffTime = Math.abs(today - expenseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  console.log(diffDays + " days");
  // get the last day remaining balance and update today's cash
  const cashSummaryRef = firestore.doc(
    `cashSummary/${date.replaceAll("/", "-")}`,
  );

  let lastDay;
  for (let i = 1; i < 365; i++) {
    let dateObj = new Date(year, parseInt(month - 1), day - i);
    let previousDate = new Date(dateObj.getTime().toString() - 86400000);
    const previousDayRef = firestore.doc(
      `cashSummary/${previousDate
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")}`,
    );
    const previouseDay = await previousDayRef.get();
    if (previouseDay.exists) {
      lastDay = previouseDay.data();
      break;
    }
  }
  console.log(lastDay);
  const cashSummary = await cashSummaryRef.get();
  if (cashSummary.exists) {
    cashSummaryRef.update({
      totalCashOuts:
        parseInt(cashSummary.data().totalCashOuts) + parseInt(total),
      remainingBalance:
        parseInt(cashSummary.data().remainingBalance) - parseInt(total),
    });
  } else {
    cashSummaryRef.set({
      month: cashOutMonth,
      date: date,
      previousCash: parseInt(lastDay.remainingBalance || 0),
      totalCashIns: 0,
      totalCashOuts: total,
      remainingBalance:
        parseInt(lastDay.remainingBalance || 0) - parseInt(total),
    });
  }

  // update every next day
  if (diffDays > 0) {
    for (let i = 1; i < parseInt(diffDays + 1); i++) {
      let dateObj = new Date(
        year,
        parseInt(parseInt(month) - 1),
        parseInt(day) + i,
      );
      dateObj.setDate(dateObj.getDate());

      console.log(dateObj.toLocaleDateString("en-GB").replaceAll("/", "-"));
      const nextDayRef = firestore.doc(
        `cashSummary/${dateObj
          .toLocaleDateString("en-GB")
          .replaceAll("/", "-")}`,
      );
      const nextDay = await nextDayRef.get();
      console.log(nextDay.data());
      if (nextDay.exists) {
        await nextDayRef.update({
          previousCash: parseInt(nextDay.data().previousCash) - parseInt(total),
          remainingBalance:
            parseInt(nextDay.data().remainingBalance) - parseInt(total),
        });
      }
    }
  }
};
export const updateCashSummaryCashIn = async (cashInMonth, date, total) => {
  const [day, month, year] = date.split("/");
  let today = new Date();
  let expenseDate = new Date(year, parseInt(month - 1), day);

  const diffTime = Math.abs(today - expenseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  console.log(diffDays + " days");
  // get the last day remaining balance and update today's cash
  const cashSummaryRef = firestore.doc(
    `cashSummary/${date.replaceAll("/", "-")}`,
  );

  let lastDay;
  for (let i = 1; i < 365; i++) {
    let dateObj = new Date(year, parseInt(month - 1), day - i);
    let previousDate = new Date(dateObj.getTime().toString() - 86400000);
    const previousDayRef = firestore.doc(
      `cashSummary/${previousDate
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")}`,
    );
    const previouseDay = await previousDayRef.get();
    if (previouseDay.exists) {
      lastDay = previouseDay.data();
      break;
    }
  }
  console.log(lastDay);
  const cashSummary = await cashSummaryRef.get();
  if (cashSummary.exists) {
    cashSummaryRef.update({
      totalCashIns: parseInt(cashSummary.data().totalCashIns) + parseInt(total),
      remainingBalance:
        parseInt(cashSummary.data().remainingBalance) + parseInt(total),
    });
  } else {
    cashSummaryRef.set({
      month: cashInMonth,
      date: date,
      previousCash: parseInt(lastDay.remainingBalance || 0),
      totalCashIns: parseInt(total),
      totalCashOuts: 0,
      remainingBalance:
        parseInt(lastDay.remainingBalance || 0) + parseInt(total),
    });
  }

  // update every next day
  if (diffDays > 0) {
    for (let i = 1; i < parseInt(diffDays + 1); i++) {
      let dateObj = new Date(
        year,
        parseInt(parseInt(month) - 1),
        parseInt(day) + i,
      );
      dateObj.setDate(dateObj.getDate());

      console.log(dateObj.toLocaleDateString("en-GB").replaceAll("/", "-"));
      const nextDayRef = firestore.doc(
        `cashSummary/${dateObj
          .toLocaleDateString("en-GB")
          .replaceAll("/", "-")}`,
      );
      const nextDay = await nextDayRef.get();
      console.log(nextDay.data());
      if (nextDay.exists) {
        await nextDayRef.update({
          previousCash: parseInt(nextDay.data().previousCash) + parseInt(total),
          remainingBalance:
            parseInt(nextDay.data().remainingBalance) + parseInt(total),
        });
      }
    }
  }
};

export const getAllEmployees = async () => {
  const employeesCollectionRef = firestore.collection("employees");
  try {
    const employees = await employeesCollectionRef.get();
    const employeesArray = [];
    employees.forEach((doc) => {
      employeesArray.push(doc.data());
    });
    return employeesArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadTransaction = async (transactionObj) => {
  const transactionRef = firestore.doc(`transactions/${transactionObj.id}`);
  const snapShot = await transactionRef.get();
  if (!snapShot.exists) {
    try {
      await transactionRef.set({
        ...transactionObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await transactionRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a transaction with similar name, please change the name and try again",
    );
  }
};

export const getAllInstallmentsCashOutCustomer = async (customer) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("category", "==", "MONTHLY INSTALLMENT")
    .where("uid", "==", customer);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadCnf = async (cnfObj) => {
  const cnfRef = firestore.doc(`cnfs/${cnfObj.cnfId}`);
  const snapShot = await cnfRef.get();
  if (!snapShot.exists) {
    try {
      await cnfRef.set({
        ...cnfObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await cnfRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a cnf with similar name, please change the name and try again",
    );
  }
};
export const uploadCnfBill = async (billObj) => {
  const batch = firestore.batch();
  const cnfBillRef = firestore.doc(`cnfBills/${billObj.id}`);
  const cnfBillMonthRef = firestore.doc(`cnfBillMonths/${billObj.month}`);

  // Get the documents
  const cnfBillSnapShot = await cnfBillRef.get();
  const cnfBillMonthSnapShot = await cnfBillMonthRef.get();

  // Check if the bill document exists
  if (!cnfBillSnapShot.exists) {
    try {
      // Set the bill document
      batch.set(cnfBillRef, {
        ...billObj,
      });
      console.log(cnfBillSnapShot.data());
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a bill with similar id, please try again later");
  }

  // Check if the bill month document exists
  if (!cnfBillMonthSnapShot.exists) {
    // Set the bill month document
    batch.set(cnfBillMonthRef, { month: billObj.month });
  }

  // Commit the batch
  await batch.commit();

  return true;
};
export const deletePreviousLotBill = async (lotNo) => {
  const billsCollectionRef = firestore
    .collection("cnfBills")
    .where("lotNumber", "==", lotNo);
  try {
    const bills = await billsCollectionRef.get();
    bills.forEach(async (doc) => {
      const billRef = firestore.doc(`cnfBills/${doc.data().id}`);
      await billRef.delete();
    });
  } catch (error) {
    alert(error);
  }
};
export const getAllCnfBills = async (month, name) => {
  const cnfsCollectionRef = firestore
    .collection("cnfBills")
    .where("month", "==", month)
    .where("cnf", "==", name);
  try {
    const cnfs = await cnfsCollectionRef.get();
    const cnfsArray = [];
    cnfs.forEach((doc) => {
      cnfsArray.push(doc.data());
    });
    return cnfsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllCnfBillsAllMonths = async (name) => {
  const cnfsCollectionRef = firestore
    .collection("cnfBills")
    .where("cnf", "==", name);
  try {
    const cnfs = await cnfsCollectionRef.get();
    const cnfsArray = [];
    cnfs.forEach((doc) => {
      cnfsArray.push(doc.data());
    });
    return cnfsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllMonthsCnfBill = async (month) => {
  const monthRef = firestore.doc(`cnfBillMonths/${month}`);
  const monthdata = await monthRef.get();

  if (!monthdata.exists) {
    await monthRef.set({
      month: month,
    });
  }

  const monthsCollectionRef = firestore.collection(`cnfBillMonths`);
  try {
    const expenses = await monthsCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const deleteCnf = async (cnfId) => {
  const cnfRef = firestore.doc(`cnfs/${cnfId}`);
  const snapShot = await cnfRef.get();
  console.log(snapShot.data());
  try {
    await cnfRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const updateCnf = async (cnfObj) => {
  const cnfRef = firestore.doc(`cnfs/${cnfObj.cnfId}`);
  try {
    await cnfRef.update({ ...cnfObj });
    const snapShot = await cnfRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const getAllLoansCashInCustomer = async (customer) => {
  const cashInsCollectionRef = firestore
    .collection("dailyCashIn")
    .where("category", "==", "LOAN")
    .where("uid", "==", customer);
  try {
    const cashIns = await cashInsCollectionRef.get();
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push(doc.data());
    });
    return cashInsArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllLoansCashIns = async () => {
  const cashInsCollectionRef = firestore
    .collection("dailyCashIn")
    .where("category", "==", "LOAN");
  try {
    const cashIns = await cashInsCollectionRef.get();
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push(doc.data());
    });
    return cashInsArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllLoansCashOutCustomer = async (customer) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("category", "==", "LOAN")
    .where("uid", "==", customer);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllLoansCashOuts = async () => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("category", "==", "LOAN");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllMonthlyCashSummary = async () => {
  const expensesCollectionRef = firestore.collection("cashSummary");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllMonthlyCashIn = async () => {
  const expensesCollectionRef = firestore.collection("monthlyCashIn");
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllMonthlySalary = async () => {
  const expensesCollectionRef = firestore.collection(`monthlySalary`);

  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getAllPendingCashIns = async () => {
  const cashInsCollectionRef = firestore
    .collection("dailyCashIn")
    .where("status", "==", "pending");
  try {
    const cashIns = await cashInsCollectionRef.get();
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push(doc.data());
    });
    return cashInsArray;
  } catch (error) {
    alert(error);
  }
};

export const getSingleMonthlySalary = async (month, category) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("month", "==", month)
    .where("category", "==", category);

  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getSingleMonthlyLoanCashIn = async (month, category) => {
  const cashInsCollectionRef = firestore
    .collection("dailyCashIn")
    .where("month", "==", month)
    .where("category", "==", category);

  try {
    const cashIns = await cashInsCollectionRef.get();
    const cashInsArray = [];
    cashIns.forEach((doc) => {
      cashInsArray.push(doc.data());
    });
    return cashInsArray;
  } catch (error) {
    alert(error);
  }
};

export const getSingleMonthlyLoanCashOut = async (month, category) => {
  const expensesCollectionRef = firestore
    .collection("dailyExpenses")
    .where("month", "==", month)
    .where("category", "==", category);

  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getSingleMonthlyCashIn = async (month) => {
  const expensesCollectionRef = firestore
    .collection("dailyCashIn")
    .where("month", "==", month);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};
export const getSingleMonthly = async (month, category, subCategory) => {
  if (category === "INVEST") {
    const expensesCollectionRef = firestore
      .collection("dailyExpenses")
      .where("month", "==", month)
      .where("category", "==", category)
      .where("subCategory", "==", subCategory);
    const cashInCollectionRef = firestore
      .collection("dailyCashIn")
      .where("month", "==", month)
      .where("category", "==", category)
      .where("subCategory", "==", subCategory);
    try {
      const expenses = await expensesCollectionRef.get();
      const cashIns = await cashInCollectionRef.get();
      const expensesArray = [];
      expenses.forEach((doc) => {
        expensesArray.push(doc.data());
      });

      cashIns.forEach((doc) => {
        expensesArray.push(doc.data());
      });
      return expensesArray.sort((a, b) => a.id - b.id);
    } catch (error) {
      alert(error);
    }
  } else if (category == "REFUND") {
    const expensesCollectionRef = firestore
      .collection("dailyExpenses")
      .where("month", "==", month)
      .where("category", "==", category);

    try {
      const expenses = await expensesCollectionRef.get();
      const expensesArray = [];
      expenses.forEach((doc) => {
        expensesArray.push(doc.data());
      });
      return expensesArray;
    } catch (error) {
      alert(error);
    }
  } else {
    const expensesCollectionRef = firestore
      .collection("dailyExpenses")
      .where("month", "==", month)
      .where("category", "==", category)
      .where("subCategory", "==", subCategory);
    try {
      const expenses = await expensesCollectionRef.get();
      const expensesArray = [];
      expenses.forEach((doc) => {
        expensesArray.push(doc.data());
      });
      return expensesArray;
    } catch (error) {
      alert(error);
    }
  }
};

export const getSingleMonthlyCashSummary = async (month) => {
  const expensesCollectionRef = firestore
    .collection("cashSummary")
    .where("month", "==", month);
  try {
    const expenses = await expensesCollectionRef.get();
    const expensesArray = [];
    expenses.forEach((doc) => {
      expensesArray.push(doc.data());
    });
    return expensesArray;
  } catch (error) {
    alert(error);
  }
};

export const getSingleCustomerLoan = async (customer) => {
  const loanRef = firestore.doc(`customerLoans/${customer}`);
  try {
    const customerLoan = await loanRef.get();
    return customerLoan.data();
  } catch (error) {
    alert(error);
  }
};
export const getAllMonthly = async (category, subCategory) => {
  if (category == "REFUND") {
    const expensesCollectionRef = firestore
      .collection(`categoryMonthlyExpense`)
      .where("category", "==", category);

    try {
      const expenses = await expensesCollectionRef.get();
      const expensesArray = [];
      expenses.forEach((doc) => {
        expensesArray.push(doc.data());
      });
      return expensesArray;
    } catch (error) {
      alert(error);
    }
  } else {
    const expensesCollectionRef = firestore
      .collection(`categoryMonthlyExpense`)
      .where("category", "==", category)
      .where("subCategory", "==", subCategory);
    try {
      const expenses = await expensesCollectionRef.get();
      const expensesArray = [];
      expenses.forEach((doc) => {
        expensesArray.push(doc.data());
      });
      return expensesArray;
    } catch (error) {
      alert(error);
    }
  }
};

// get all users

export const getAllUsers = async () => {
  const usersCollectionRef = firestore.collection("users");
  try {
    const users = await usersCollectionRef.get();
    const usersArray = [];
    users.forEach((doc) => {
      usersArray.push({ uid: doc.id, ...doc.data() });
    });
    return usersArray;
  } catch (error) {
    alert(error);
  }
};

export const deleteUser = async (id) => {
  const productRef = firestore.doc(`users/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

// Orders management (get all orders)

export const getAllOrders = async () => {
  const ordersCollectionRef = firestore.collection("orders");
  try {
    const orders = await ordersCollectionRef.get();
    const ordersArray = [];
    orders.forEach((doc) => {
      ordersArray.push({ orderId: doc.id, ...doc.data() });
    });
    return ordersArray;
  } catch (error) {
    alert(error);
  }
};

export const deleteOrder = async (id) => {
  const orderRef = firestore.doc(`orders/${id}`);
  try {
    await orderRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getSingleOrder = async (id) => {
  const orderRef = firestore.doc(`orders/${id}`);
  try {
    const order = await orderRef.get();
    return order.data();
  } catch (error) {
    alert(error);
  }
};
export const getSingleOrderApi = async (id) => {
  const orderRef = firestore.doc(`ordersApi/${id}`);
  try {
    const order = await orderRef.get();
    return order.data();
  } catch (error) {
    alert(error);
  }
};

export const updateUserStatus = async (userObj) => {
  const userRef = firestore.doc(`users/${userObj.uid}`);
  try {
    const snapShot = await userRef.get();
    console.log(snapShot.data());
    await userRef.update({
      status: userObj.status,
    });
    const updatedSnapShot = await userRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const getSingleProductRequest = async (id) => {
  const orderRef = firestore.doc(`bookingRequest/${id}`);
  try {
    const order = await orderRef.get();
    return order.data();
  } catch (error) {
    alert(error);
  }
};

export const setProductRequest = async (bookingObj) => {
  const bookingId = `${Math.round(Math.random() * 1000000 - 1)}`;
  const bookingRef = firestore.doc(`bookingRequest/${bookingId}`);
  delete bookingObj.file;
  const snapShot = await bookingRef.get();
  if (!snapShot.exists) {
    try {
      await bookingRef.set({
        bookingId,
        ...bookingObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await bookingRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a booking with similar uid, please try again later",
    );
  }
};

export const getSinglePaymentRequestOrder = async (id) => {
  const orderRef = firestore.doc(`paymentRequestApi/${id}`);
  try {
    const order = await orderRef.get();
    return order.data();
  } catch (error) {
    alert(error);
  }
};
export const getSingleRefundRequestOrder = async (id) => {
  const refundRef = firestore.doc(`refundRequest/${id}`);
  try {
    const refund = await refundRef.get();
    return refund.data();
  } catch (error) {
    alert(error);
  }
};
export const getSinglePaymentRequest = async (id) => {
  const orderRef = firestore.doc(`paymentRequest/${id}`);
  try {
    const order = await orderRef.get();
    return order.data();
  } catch (error) {
    alert(error);
  }
};

export const updateOrder = async (orderObj) => {
  const orderRef = firestore.doc(`orders/${orderObj.orderId}`);
  const order = await orderRef.get();
  try {
    await orderRef.update({
      ...order.data(),
      status: orderObj.status,
      paymentStatus: { ...order.data().paymentStatus, paid: orderObj.paid },
    });
  } catch (error) {
    alert(error);
  }
};

export const updateMultipleOrder = async (orderIdArray, status) => {
  orderIdArray.forEach(async (orderId) => {
    const orderRef = firestore.doc(`orders/${orderId}`);
    const order = await orderRef.get();
    const userId = await order.data().userId;
    const userRef = firestore.doc(`users/${userId}`);
    const user = await userRef.get();
    var exactOrder = user
      .data()
      .ordersArray.find((order) => order.orderId == orderId);
    exactOrder.status = status;
    var otherOrders = user
      .data()
      .ordersArray.filter((order) => order.orderId !== orderId);
    console.log(status);
    if (status == "delivered") {
      console.log(status);
      const adminsCollectionRef = firestore.collection("admins");
      const admins = await adminsCollectionRef.get();
      admins.forEach(async (doc) => {
        console.log(doc.data().pending_orders.includes(orderId));
        if (doc.data().pending_orders.includes(orderId)) {
          console.log(status);
          var adminRef = firestore.doc(`admins/${doc.id}`);
          var updatedPendingOrders = doc
            .data()
            .pending_orders.filter((order) => order !== orderId);
          var newly_used_balance = order.data().sum;
          var total_used_balance = doc.data().used_balance
            ? doc.data().used_balance + newly_used_balance
            : newly_used_balance;
          await adminRef.update({
            ...doc.data(),
            pending_orders: [...updatedPendingOrders],
            successfully_delivered_orders: doc.data()
              .successfully_delivered_orders
              ? [...doc.data().successfully_delivered_orders, orderId]
              : [orderId],
            used_balance: total_used_balance,
            remaining_balance:
              doc.data().balance - parseInt(total_used_balance),
          });
        }
      });
    }
    try {
      await userRef.update({ ordersArray: [exactOrder, ...otherOrders] });
      return await orderRef.update({ ...order.data(), status: status });
    } catch (error) {
      alert(error);
    }
  });
};

export const updateMultipleOrderwithOrderTo = async (
  orderIdArray,
  status,
  orderTo,
) => {
  orderIdArray.forEach(async (orderId) => {
    const orderRef = firestore.doc(`orders/${orderId}`);
    const order = await orderRef.get();
    const userId = await order.data().userId;
    const userRef = firestore.doc(`users/${userId}`);
    const user = await userRef.get();
    var exactOrder = user
      .data()
      .ordersArray.find((order) => order.orderId == orderId);
    exactOrder.status = status;
    if (!exactOrder.orderTo) {
      exactOrder.orderTo = orderTo;
    }
    var otherOrders = user
      .data()
      .ordersArray.filter((order) => order.orderId !== orderId);
    try {
      if (!order.data().orderTo) {
        await orderRef.update({ ...order.data(), status, orderTo });
      } else {
        await orderRef.update({
          ...order.data(),
          orderTo: order.data().orderTo,
          status,
        });
        alert(
          `this ${orderId} order is already ordered to another supplier. check ordered products`,
        );
      }
      await userRef.update({ ordersArray: [exactOrder, ...otherOrders] });
    } catch (error) {
      alert(error);
    }
  });
};

// paymet management
export const getAllPayments = async () => {
  const paymentsCollectionRef = firestore.collection("payments");
  try {
    const payments = await paymentsCollectionRef.get();
    const paymentsArray = [];
    payments.forEach((doc) => {
      paymentsArray.push({ uid: doc.id, ...doc.data() });
    });
    return paymentsArray;
  } catch (error) {
    alert(error);
  }
};

export const deletePayment = async (orderId) => {
  const paymentRef = firestore.doc(`payments/${orderId}`);
  try {
    await paymentRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const updatePaymentStatus = async (paymentObj) => {
  const paymentRef = firestore.doc(`payments/${paymentObj.orderId}`);
  const payment = await paymentRef.get();
  var actualPayment = payment
    .data()
    .payments.find((payment) => payment.paymentId == paymentObj.paymentId);
  const orderId = actualPayment.orderId;
  const orderRef = firestore.doc(`orders/${orderId}`);
  const order = await orderRef.get();
  const userId = await order.data().userId;
  const userRef = firestore.doc(`users/${userId}`);
  const user = await userRef.get();
  var exactPayment = user
    .data()
    .paymentsArray.find((payment) => payment.paymentId == paymentObj.paymentId);
  exactPayment.paymentStatus = paymentObj.paymentStatus;
  var otherPayments = user
    .data()
    .paymentsArray.filter(
      (payment) => payment.paymentId !== paymentObj.paymentId,
    );

  await userRef.update({ paymentsArray: [exactPayment, ...otherPayments] });
  const updatedPaymentObj = payment
    .data()
    .payments.find((payment) => payment.paymentId == paymentObj.paymentId);
  updatedPaymentObj.paymentStatus = paymentObj.paymentStatus;
  const newPaymentsArray = payment
    .data()
    .payments.filter((payment) => payment.paymentId !== paymentObj.paymentId);
  try {
    await paymentRef.update({
      ...payment.data(),
      payments: [...newPaymentsArray, updatedPaymentObj],
    });
  } catch (error) {
    alert(error);
  }
};

export const updateOrderAmount = async (paymentObj) => {
  const orderRef = firestore.doc(`orders/${paymentObj.orderId}`);
  const order = await orderRef.get();
  const userId = await order.data().userId;
  const userRef = firestore.doc(`users/${userId}`);
  const user = await userRef.get();
  var exactOrder = user
    .data()
    .ordersArray.find((order) => order.orderId == paymentObj.orderId);
  exactOrder.status === "order_pending"
    ? (exactOrder.status = "payment_approved")
    : (exactOrder.status = exactOrder.status);
  exactOrder.paymentStatus.paid =
    parseInt(exactOrder.paymentStatus.paid) + parseInt(paymentObj.amount);
  exactOrder.paymentStatus.due =
    parseInt(exactOrder.paymentStatus.total) -
    parseInt(exactOrder.paymentStatus.paid);
  var otherOrders = user
    .data()
    .ordersArray.filter((order) => order.orderId !== paymentObj.orderId);
  await userRef.update({ ordersArray: [exactOrder, ...otherOrders] });
  try {
    const order = await orderRef.get();
    console.log(order.data());
    await orderRef.update({
      ...order.data(),
      status:
        order.data().status === "order_pending"
          ? "payment_approved"
          : order.data().status,
      paymentStatus: {
        ...order.data().paymentStatus,
        due:
          parseInt(order.data().paymentStatus.total) -
          (parseInt(order.data().paymentStatus.paid) +
            parseInt(paymentObj.amount)),
        paid:
          parseInt(order.data().paymentStatus.paid) +
          parseInt(paymentObj.amount),
      },
    });
  } catch (error) {
    alert(error);
  }
};

// distribute order to managers
export const orderProductsFromChina = async (orderIdArray, orderTo) => {
  const adminsCollectionRef = firestore.collection("admins");
  orderIdArray.forEach(async (orderId) => {
    const orderRef = firestore.doc(`orders/${orderId}`);
    try {
      const order = await orderRef.get();
      if (!order.data().orderTo) {
        try {
          const admins = await adminsCollectionRef.get();
          admins.forEach((doc) => {
            var adminRef = firestore.doc(`admins/${doc.id}`);
            if (doc.data().name == orderTo) {
              adminRef.update({
                ...doc.data(),
                pending_orders: [...doc.data().pending_orders, orderId],
              });
              return;
            }
          });
        } catch (error) {
          alert(error);
        }
      } else {
        console.log(
          `${orderId} is already ordered to another supplier.check ordered item`,
        );
      }
    } catch (error) {
      console.log(error);
    }
  });
};

export const productToOrder = async (productsArray) => {
  productsArray.forEach((product) => {
    const productToOrderRef = firestore.doc(`productToOrder/${product.id}`);
    try {
      productToOrderRef.set(product);
    } catch (error) {
      alert(error);
    }
  });
};

// admins
export const getAllAdmins = async () => {
  const adminsCollectionRef = firestore.collection("admins");
  try {
    const admins = await adminsCollectionRef.get();
    const adminsArray = [];
    admins.forEach((doc) => {
      adminsArray.push({ adminId: doc.id, ...doc.data() });
    });
    return adminsArray;
  } catch (error) {
    alert(error);
  }
};

export const rechargeAdmin = async (adminIdArray, balance) => {
  adminIdArray.forEach(async (adminId) => {
    const adminRef = firestore.doc(`admins/${adminId}`);
    try {
      const admin = await adminRef.get();
      var total_balance = parseInt(admin.data().balance) + parseInt(balance);
      await adminRef.update({
        ...admin.data(),
        balance: admin.data().balance
          ? parseInt(admin.data().balance) + parseInt(balance)
          : parseInt(balance),
        remaining_balance: total_balance - parseInt(admin.data().used_balance),
      });
    } catch (error) {
      alert(error);
    }
  });
};

export const updateProfileImage = async (imgUrl, id) => {
  const adminRef = firestore.doc(`admins/${id}`);
  try {
    const admin = await adminRef.get();
    await adminRef.update({ ...admin.data(), image: imgUrl });
  } catch (error) {
    alert(error);
  }
};
export const setRmbPrice = async (taka) => {
  const currencyRef = firestore.doc(`Currency/taka`);
  let rmbRate;
  if (taka) {
    try {
      const currency = await currencyRef.get();
      if (currency.data()) {
        await currencyRef.update({ ...currency.data(), taka });
        rmbRate = taka;
        return rmbRate;
      } else {
        await currencyRef.set({ taka: taka });
        rmbRate = taka;
        return rmbRate;
      }
    } catch (error) {
      alert(error);
    }
  } else {
    try {
      const currency = await currencyRef.get();
      rmbRate = currency.data().taka;
      return rmbRate;
    } catch (error) {
      alert(error);
    }
  }
};

export const getAllProductRequests = async (status) => {
  const reqeustsCollectionRef = firestore
    .collection("bookingRequest")
    .where("orderStatus", "==", status);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
/* Everything sitting at "Custom released" (stored as "Bangladesh warehouse")
   across 1688 orders, product requests and Ship For Me bookings — the cargo
   collection sheet's source. */
export const getCustomReleasedParcels = async () => {
  const STATUS = "Bangladesh warehouse";
  const read = async (collectionName, field) => {
    try {
      const snapshot = await firestore
        .collection(collectionName)
        .where(field, "==", STATUS)
        .get();
      const docs = [];
      snapshot.forEach((doc) => docs.push(doc.data()));
      return docs;
    } catch (error) {
      alert(error);
      return [];
    }
  };
  const [orders, productRequests, shipments] = await Promise.all([
    read("ordersApi", "orderStatus"),
    read("bookingRequest", "orderStatus"),
    read("shipForMe", "status"),
  ]);
  return { orders, productRequests, shipments };
};

/* Every customer profile, for matching a search on customer number / phone /
   email against records that only store the account id. */
export const getCustomersForSearch = async () => {
  try {
    const snapshot = await firestore.collection("users").get();
    const users = [];
    snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
    return users;
  } catch (error) {
    alert(error);
    return [];
  }
};

/* Every booking in a collection, newest first. The list pages load one status
   tab at a time (and filter to the last 30 days), so a booking-id search has
   to look beyond that — these collections are small enough to read whole. */
export const getAllRequestsForSearch = async (collectionName) => {
  try {
    const snapshot = await firestore.collection(collectionName).get();
    const requestsArray = [];
    snapshot.forEach((doc) => requestsArray.push(doc.data()));
    return requestsArray.sort((a, b) => (b.time || 0) - (a.time || 0));
  } catch (error) {
    alert(error);
    return [];
  }
};

export const getAllShipmentRequests = async (status) => {
  const reqeustsCollectionRef = firestore
    .collection("shipForMe")
    .where("status", "==", status);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllOrderOfSingleUser = async (userId) => {
  const reqeustsCollectionRef = firestore
    .collection("ordersApi")
    .where("userId", "==", userId);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllShipForMeOfSingleUser = async (userId) => {
  const reqeustsCollectionRef = firestore
    .collection("shipForMe")
    .where("userId", "==", userId);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllPaymentOfSingleUser = async (userId) => {
  const reqeustsCollectionRef = firestore
    .collection("paymentRequestApi")
    .where("userId", "==", userId);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllProductRequestOfSingleUser = async (userId) => {
  const reqeustsCollectionRef = firestore
    .collection("bookingRequest")
    .where("userId", "==", userId);

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getAllShipmentRequestsToChangeStatus = async () => {
  const reqeustsCollectionRef = firestore
    .collection("shipForMe")
    .where("status", "!=", "Delivered");

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllOrdersToChangeStatus = async () => {
  const reqeustsCollectionRef = firestore
    .collection("ordersApi")
    .where("orderStatus", "!=", "Delivered");

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllProductRequestToChangeStatus = async () => {
  const reqeustsCollectionRef = firestore
    .collection("bookingRequest")
    .where("orderStatus", "!=", "Delivered");

  try {
    const requests = await reqeustsCollectionRef.get();
    const requestsArray = [];
    requests.forEach((doc) => {
      requestsArray.push(doc.data());
    });
    return requestsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const updateProductRequest = async (requestObj) => {
  const reqeustRef = firestore.doc(`bookingRequest/${requestObj.bookingId}`);

  try {
    await reqeustRef.update({
      ...requestObj,
    });
    const request = await reqeustRef.get();
    return request.data();
  } catch (error) {
    alert(error);
  }
};
export const updateProduct = async (productObj) => {
  const productRef = firestore.doc(`aliproducts/${productObj.id}`);

  try {
    await productRef.update({
      ...productObj,
    });
    const product = await productRef.get();
    return product.data();
  } catch (error) {
    alert(error);
  }
};

export const createIntro = async (introObj) => {
  const introRef = firestore.doc(`intros/${introObj.id}`);
  const snapShot = await introRef.get();

  delete introObj.file;
  if (!snapShot.exists) {
    try {
      await introRef.set({
        ...introObj,
      });

      const uploadedSnapShot = await introRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already an Intro image with similar Id, please try again later",
    );
  }
};

export const uploadImageIntro = async (file) => {
  const imageRef = storage.ref(`intro/${file.name}`);
  try {
    await imageRef.put(file);
    var imgUrl = [];
    await imageRef.getDownloadURL().then((url) => {
      console.log(url);
      imgUrl.push(url);
    });

    return imgUrl[0];
  } catch (error) {
    return null;
  }
};

export const createSalaryMonth = async (month, employee) => {
  const categoryMonthlyExpenseRef = firestore.doc(
    `categoryMonthlyExpense/${month}-SALARY-${employee.name}`,
  );
  const categoryMonthlyExpnese = await categoryMonthlyExpenseRef.get();
  if (!categoryMonthlyExpnese.exists) {
    await categoryMonthlyExpenseRef.set({
      id: `${month}-SALARY-${employee.name}`,
      amount: 0,
      category: "SALARY",
      subCategory: employee.name,
      month: month,
      paid: false,
      salary: 0,
    });
  }
};

export const getAllIntros = async () => {
  const introsCollectionRef = firestore.collection("intros");
  try {
    const intros = await introsCollectionRef.get();
    const introsArray = [];
    intros.forEach((doc) => {
      introsArray.push(doc.data());
    });
    return introsArray;
  } catch (error) {
    alert(error);
  }
};

export const deleteIntro = async (id) => {
  const introRef = firestore.doc(`intros/${id}`);
  try {
    await introRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const selectIntro = async (id) => {
  const introRef = firestore.doc(`intros/${id}`);
  const introCollectionRef = firestore
    .collection("intros")
    .where("selected", "==", true);
  const introCollection = await introCollectionRef.get();
  introCollection.forEach(async (intro) => {
    const previousIntroRef = firestore.doc(`intros/${intro.data().id}`);
    try {
      await previousIntroRef.update({
        selected: false,
      });
    } catch (error) {
      alert(error);
    }
  });
  try {
    await introRef.update({
      selected: true,
    });
  } catch (error) {
    alert(error);
  }
};
export const updateShipmentRequest = async (requestObj) => {
  const reqeustRef = firestore.doc(`shipForMe/${requestObj.bookingId}`);

  try {
    await reqeustRef.update({
      ...requestObj,
    });
    const request = await reqeustRef.get();
    return request.data();
  } catch (error) {
    alert(error);
  }
};
export const deleteShipmentRequest = async (requestObj) => {
  const reqeustRef = firestore.doc(`shipForMe/${requestObj.bookingId}`);

  try {
    await reqeustRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getAllPaymentRequest = async () => {
  const paymentRequestCollectionRef = firestore
    .collection("paymentRequest")
    .where("status", "==", "pending");

  try {
    const paymentRequest = await paymentRequestCollectionRef.get();
    const paymentRequestArray = [];
    paymentRequest.forEach((doc) => {
      paymentRequestArray.push(doc.data());
    });
    console.log(paymentRequestArray);
    return paymentRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllPaymentRequestOrder = async () => {
  const paymentRequestCollectionRef = firestore
    .collection("paymentRequestApi")
    .where("status", "==", "pending");

  try {
    const paymentRequest = await paymentRequestCollectionRef.get();
    const paymentRequestArray = [];
    paymentRequest.forEach((doc) => {
      paymentRequestArray.push(doc.data());
    });
    console.log(paymentRequestArray);
    return paymentRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getApprovedPaymentRequests = async () => {
  const paymentRequestCollectionRef = firestore
    .collection("paymentRequest")
    .where("status", "==", "paid");

  try {
    const paymentRequest = await paymentRequestCollectionRef.get();
    const paymentRequestArray = [];
    paymentRequest.forEach((doc) => {
      paymentRequestArray.push(doc.data());
    });
    return paymentRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getApprovedPaymentRequestOrders = async () => {
  const paymentRequestCollectionRef = firestore
    .collection("paymentRequestApi")
    .where("status", "==", "approved");

  try {
    const paymentRequest = await paymentRequestCollectionRef.get();
    const paymentRequestArray = [];
    paymentRequest.forEach((doc) => {
      paymentRequestArray.push(doc.data());
    });
    return paymentRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getAllQuickRefundRequest = async () => {
  const refundRequestCollectionRef = firestore
    .collection("refundRequest")
    .where("status", "==", "pending")
    .where("quickRefund", "==", true);

  try {
    const refundRequest = await refundRequestCollectionRef.get();
    const refundRequestArray = [];
    refundRequest.forEach((doc) => {
      refundRequestArray.push(doc.data());
    });
    console.log(refundRequestArray);
    return refundRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const getAllAfterSale = async () => {
  const refundRequestCollectionRef = firestore
    .collection("refundRequest")
    .where("status", "==", "pending")
    .where("quickRefund", "==", false);

  try {
    const refundRequest = await refundRequestCollectionRef.get();
    const refundRequestArray = [];
    refundRequest.forEach((doc) => {
      refundRequestArray.push(doc.data());
    });
    console.log(refundRequestArray);
    return refundRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getApprovedQuickRefundRequest = async () => {
  const refundRequestCollectionRef = firestore
    .collection("refundRequest")
    .where("status", "==", "approved")
    .where("quickRefund", "==", true);

  try {
    const refundRequest = await refundRequestCollectionRef.get();
    const refundRequestArray = [];
    refundRequest.forEach((doc) => {
      refundRequestArray.push(doc.data());
    });
    return refundRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getApprovedAfterSale = async () => {
  const refundRequestCollectionRef = firestore
    .collection("refundRequest")
    .where("status", "==", "approved")
    .where("quickRefund", "==", false);

  try {
    const refundRequest = await refundRequestCollectionRef.get();
    const refundRequestArray = [];
    refundRequest.forEach((doc) => {
      refundRequestArray.push(doc.data());
    });
    return refundRequestArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

// Loyalty points: 1 point per 1 Tk of any verified payment (order, product
// request, or shipment). Buyer level is derived from the running total —
// see the Points page in the customer app for the same thresholds.
const computeBuyerLvl = (totalPoints) => {
  if (totalPoints > 500000) return 4;
  if (totalPoints > 300000) return 3;
  if (totalPoints > 100000) return 2;
  return 1;
};

export const addUserPoints = async (userId, amount) => {
  const points = parseInt(amount) || 0;
  if (!userId || points <= 0) return;
  const userRef = firestore.doc(`users/${userId}`);
  try {
    const snap = await userRef.get();
    if (!snap.exists) return;
    const newTotal = (parseInt(snap.data().totalPoints) || 0) + points;
    await userRef.update({
      totalPoints: newTotal,
      buyerLvl: computeBuyerLvl(newTotal),
    });
  } catch (error) {
    console.error(error);
  }
};

export const updatePaymentRequestStatus = async (paymentRequestObj) => {
  console.log(paymentRequestObj);
  let date = new Date();
  const paymentRequestRef = firestore.doc(
    `paymentRequest/${paymentRequestObj.paymentId}`,
  );
  const snapshot = await paymentRequestRef.get();
  if (snapshot.exists) {
    try {
      paymentRequestObj.productRequestArray.forEach(
        async (productRequest, index) => {
          if (productRequest.shipFrom) {
            // Each ship-for-me booking is always paid in full (no partial
            // payments for this flow) — use THIS booking's own shipping
            // charge as its payment amount, not paymentRequestObj.amount
            // (the combined total across every booking in this payment
            // request), otherwise combining N bookings would record the
            // full combined total N times over in both this booking's
            // payment history and the daily cash-in ledger.
            const itemAmount =
              parseInt(productRequest.shippingChargeCustomer) || 0;
            const bookingRequestRef = firestore.doc(
              `shipForMe/${productRequest.bookingId}`,
            );
            const bookingRequest = await bookingRequestRef.get();
            await bookingRequestRef.update({
              paymentRequested: false,
              paymentStatus:
                paymentRequestObj.status != "rejected"
                  ? "Paid"
                  : bookingRequest.data().paymentStatus
                    ? bookingRequest.data().paymentStatus
                    : "Not Paid",
              payments:
                paymentRequestObj.status == "rejected"
                  ? bookingRequest.data().payments &&
                    bookingRequest.data().payments.length > 0
                    ? bookingRequest.data().payments
                    : []
                  : bookingRequest.data().payments &&
                      bookingRequest.data().payments.length > 0
                    ? [
                        ...bookingRequest.data().payments,
                        {
                          amount: itemAmount,
                          date: new Date().toLocaleDateString("en-GB"),
                          method: paymentRequestObj.method,
                          paidBy: paymentRequestObj.displayName || "user",
                          approvedBy: "admin",
                        },
                      ]
                    : [
                        {
                          amount: itemAmount,
                          date: new Date().toLocaleDateString("en-GB"),
                          method: paymentRequestObj.method,
                          paidBy: paymentRequestObj.displayName || "user",
                          approvedBy: "admin",
                        },
                      ],
            });
            let cashInObj = {
              id: `${date.getTime().toString()}${index}`,
              category: "Ship For Me",
              subCategory: paymentRequestObj.method,
              month: getMonthName(),
              date: date.toLocaleDateString("en-GB"),
              note: `Order Id: ${productRequest.bookingId}   User: ${
                paymentRequestObj.displayName || "Guest"
              }`,
              amount: itemAmount,
              receiveBy: "admin",
              status: "pending",
              unEditable: true,
            };
            const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
            cashInRef.set(cashInObj);

            if (paymentRequestObj.status != "rejected") {
              addUserPoints(bookingRequest.data().userId, itemAmount);
            }
          } else {
            const bookingRequestRef = firestore.doc(
              `bookingRequest/${productRequest.bookingId}`,
            );
            const bookingRequest = await bookingRequestRef.get();
            await bookingRequestRef.update({
              paymentStatus: paymentRequestObj.status,
              status:
                paymentRequestObj.status === "paid"
                  ? "Paid"
                  : bookingRequest.data().status,
            });
          }
        },
      );
      await paymentRequestRef.update({
        status: paymentRequestObj.status,
      });
      const updatedPaymentRequestObj = await paymentRequestRef.get();
      return updatedPaymentRequestObj.data();
    } catch (error) {
      alert(error);
    }
  } else {
    return null;
  }
};

const getTotalDue = (order) => {
  let totalPaid = 0;
  let totalDue = 0;
  let totalBill = 0;
  if (order.payments && order.payments.length > 0) {
    order.payments.map((paymnet) => {
      totalPaid += parseInt(paymnet.amount);
    });
  }
  if (order.shippingChargeCustomer && order.shippingChargeCustomer != 0) {
    totalBill = order.orderTotal
      ? parseInt(order.orderTotal) +
        parseInt(order.shippingChargeCustomer) +
        (order.localShipping ? parseInt(order.localShipping) : 0) +
        (order.otherCost ? parseInt(order.otherCost) : 0) -
        (order.discount ? parseInt(order.discount) : 0)
      : getSingleShopTotal(order) +
        parseInt(order.shippingChargeCustomer) +
        (order.localShipping ? parseInt(order.localShipping) : 0) +
        (order.otherCost ? parseInt(order.otherCost) : 0) -
        (order.discount ? parseInt(order.discount) : 0);
  } else {
    totalBill = order.orderTotal
      ? order.orderTotal +
        (order.localShipping ? parseInt(order.localShipping) : 0) +
        (order.otherCost ? parseInt(order.otherCost) : 0) -
        (order.discount ? parseInt(order.discount) : 0)
      : getSingleShopTotal(order) +
        (order.localShipping ? parseInt(order.localShipping) : 0) +
        (order.otherCost ? parseInt(order.otherCost) : 0) -
        (order.discount ? parseInt(order.discount) : 0);
  }
  totalDue = parseInt(totalBill) - parseInt(totalPaid);
  return totalDue;
};
const getSingleShopTotal = (shop) => {
  let total = 0;
  shop.items.map((item) => {
    item.skus.map((sku) => {
      total += parseInt(parseFloat(sku.price) * parseInt(sku.totalQuantity));
    });
  });
  return total;
};
export const updatePaymentRequestOrderStatus = async (paymentRequestObj) => {
  let date = new Date();
  console.log(paymentRequestObj);
  const paymentRequestRef = firestore.doc(
    `paymentRequestApi/${paymentRequestObj.paymentId}`,
  );
  const snapshot = await paymentRequestRef.get();
  if (snapshot.exists) {
    try {
      if (paymentRequestObj.status !== "reject") {
        let balance = parseInt(paymentRequestObj.payableTotal);
        // balance2 ta hocche gateway charge shoho hisheb rakhar jonno jodi client er proyojon hoy. apatoto cash in gateway charge charai hisheb korbe client so that order er order total accurate thake .
        let balance2 = parseInt(
          paymentRequestObj.payableTotalWithGatewayCharge,
        );
        for (let i = 0; i < paymentRequestObj.pendingOrders.length; i++) {
          // ekta shop er jonno payment
          if (paymentRequestObj.pendingOrders.length == 1) {
            const element = paymentRequestObj.pendingOrders[i];
            if (paymentRequestObj.productRequest) {
              // jodi product request hoy tokhon payment
              const orderRef = firestore.doc(
                `bookingRequest/${element.bookingId}`,
              );
              const order = await orderRef.get();
              let orderTotal = order.data().orderTotal;
              let paymentsArray = [];

              if (order.data().payments && order.data().payments.length > 0) {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: paymentRequestObj.payableTotal,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                  ...order.data().payments,
                ];
              } else {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: paymentRequestObj.payableTotal,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                ];
              }
              let totalDue = getTotalDue({
                ...order.data(),
                payments: paymentsArray,
              });
              await orderRef.update({
                payments: paymentsArray,
                paymentStatus:
                  parseInt(totalDue) <= 0 &&
                  order.data().shippingChargeCustomer &&
                  order.data().shppingChargeCustomer !== 0
                    ? "Paid"
                    : "Partially Paid",
              });
              let cashInObj = {
                id: `${date.getTime().toString()}`,
                category: "Product Request",
                subCategory: paymentRequestObj.method,
                month: getMonthName(),
                date: date.toLocaleDateString("en-GB"),
                note: `Order Id: ${element.bookingId}   User: ${
                  element.displayName || "Guest"
                }`,
                amount: paymentRequestObj.payableTotal,
                receiveBy: paymentRequestObj.admin.name,
                status: "pending",
                unEditable: true,
              };
              const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
              cashInRef.set(cashInObj);
              addUserPoints(
                order.data().userId,
                paymentRequestObj.payableTotal,
              );
            } else {
              console.log("Single shop er jonno paymenet not rejected");
              const orderRef = firestore.doc(`ordersApi/${element.orderId}`);
              const order = await orderRef.get();
              let orderTotal = order.data().orderTotal;
              let paymentsArray = [];

              if (order.data().payments && order.data().payments.length > 0) {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: paymentRequestObj.payableTotal,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                  ...order.data().payments,
                ];
              } else {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: paymentRequestObj.payableTotal,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                ];
              }
              let totalDue = getTotalDue({
                ...order.data(),
                payments: paymentsArray,
              });
              await orderRef.update({
                payments: paymentsArray,
                paymentStatus:
                  parseInt(totalDue) <= 0 &&
                  order.data().shippingChargeCustomer &&
                  order.data().shppingChargeCustomer !== 0
                    ? "Paid"
                    : "Partially Paid",
              });
              let cashInObj = {
                id: `${date.getTime().toString()}`,
                category: "1688 Order",
                subCategory: paymentRequestObj.method,
                month: getMonthName(),
                date: date.toLocaleDateString("en-GB"),
                note: `Order Id: ${element.orderId}   User: ${
                  element.displayName || "Guest"
                }`,
                amount: paymentRequestObj.payableTotal,
                receiveBy: paymentRequestObj.admin.name,
                status: "pending",
                unEditable: true,
              };
              const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
              cashInRef.set(cashInObj);
              addUserPoints(
                order.data().userId,
                paymentRequestObj.payableTotal,
              );
            }
          } else {
            // multiple item combined payment — supports both regular orders
            // and, since combined product-request payments are now possible
            // too, product requests (bookingRequest collection).
            console.log("multiple shop er joono payment not rejected");
            const element = paymentRequestObj.pendingOrders[i];
            const isProductRequest = !!paymentRequestObj.productRequest;
            const orderRef = isProductRequest
              ? firestore.doc(`bookingRequest/${element.bookingId}`)
              : firestore.doc(`ordersApi/${element.orderId}`);

            if (balance > 0) {
              const order = await orderRef.get();
              // Use the item's actual remaining due (goods + shipping + local
              // courier + other cost - discount - amount already paid), not the
              // raw orderTotal field — orderTotal ignores shipping/other costs
              // and any prior payments, which previously caused the shared
              // balance to be split incorrectly across combined items.
              let orderDueBefore = Math.max(0, getTotalDue(order.data()));
              let amountForThisOrder =
                balance > orderDueBefore ? orderDueBefore : balance;
              let paymentsArray = [];

              if (order.data().payments && order.data().payments.length > 0) {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: amountForThisOrder,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                  ...order.data().payments,
                ];
              } else {
                paymentsArray = [
                  {
                    date: paymentRequestObj.date,
                    method: paymentRequestObj.method,
                    amount: amountForThisOrder,
                    receivedBy: paymentRequestObj.admin.name,
                  },
                ];
              }
              let totalDue = getTotalDue({
                ...order.data(),
                payments: paymentsArray,
              });
              await orderRef.update({
                payments: paymentsArray,
                paymentStatus:
                  parseInt(totalDue) <= 0 &&
                  order.data().shippingChargeCustomer &&
                  order.data().shppingChargeCustomer !== 0
                    ? "Paid"
                    : "Partially Paid",
              });
              let cashInObj = {
                id: `${date.getTime().toString()}${i}`,
                category: isProductRequest ? "Product Request" : "1688 Order",
                subCategory: paymentRequestObj.method,
                month: getMonthName(),
                date: date.toLocaleDateString("en-GB"),
                note: `Order Id: ${
                  isProductRequest ? element.bookingId : element.orderId
                }   User: ${element.displayName || "Guest"}`,
                amount: amountForThisOrder,
                receiveBy: paymentRequestObj.admin.name,
                status: "pending",
                unEditable: true,
              };
              const cashInRef = firestore.doc(`dailyCashIn/${cashInObj.id}`);
              cashInRef.set(cashInObj);
              addUserPoints(order.data().userId, amountForThisOrder);

              // balance theke ei order er jonno babohar kora amount bad jabe
              balance -= amountForThisOrder;
            } else {
              // balance already used up before reaching this item — nothing
              // was actually paid toward it, so release it back to "needs
              // payment": orders go back to purchaseLater, product requests
              // back to an empty paymentStatus (mirrors each item's own
              // single-item reject-branch behavior above).
              const order = await orderRef.get();
              await orderRef.update({
                paymentStatus: isProductRequest ? "" : "purchaseLater",
              });
            }
          }
        }
      } else {
        // jodi payment request reject hoy
        for (let i = 0; i < paymentRequestObj.pendingOrders.length; i++) {
          // ekta shop er jonno payment
          if (paymentRequestObj.pendingOrders.length == 1) {
            const element = paymentRequestObj.pendingOrders[i];
            if (paymentRequestObj.productRequest) {
              // jodi product request hoy tokhon payment
              const orderRef = firestore.doc(
                `bookingRequest/${element.bookingId}`,
              );
              const order = await orderRef.get();
              let orderTotal = order.data().orderTotal;
              let paymentsArray = [];

              if (order.data().payments && order.data().payments.length > 0) {
                paymentsArray = [...order.data().payments];
              } else {
                paymentsArray = [
                  {
                    amount: 0,
                  },
                ];
              }
              let paidTotal = 0;
              if (paymentsArray.length > 0) {
                paymentsArray.map((payment) => {
                  paidTotal += parseInt(payment.amount);
                });
              }
              let totalDue = getTotalDue({
                ...order.data(),
                payments: paymentsArray,
              });
              await orderRef.update({
                paymentStatus:
                  paidTotal == 0
                    ? ""
                    : parseInt(totalDue) <= 0 &&
                        order.data().shippingChargeCustomer &&
                        order.data().shppingChargeCustomer !== 0
                      ? "Paid"
                      : "Partially Paid",
              });
            } else {
              //  payment reject kore dile payment status agerta korar jonno ei code
              console.log("single shop er joono payment rejected");
              const orderRef = firestore.doc(`ordersApi/${element.orderId}`);
              const order = await orderRef.get();
              let orderTotal = order.data().orderTotal;
              let paymentsArray = [];

              if (order.data().payments && order.data().payments.length > 0) {
                paymentsArray = [...order.data().payments];
              } else {
                paymentsArray = [
                  {
                    amount: 0,
                  },
                ];
              }
              let paidTotal = 0;
              if (paymentsArray.length > 0) {
                paymentsArray.map((payment) => {
                  paidTotal += parseInt(payment.amount);
                });
              }
              let totalDue = getTotalDue({
                ...order.data(),
                payments: paymentsArray,
              });
              await orderRef.update({
                paymentStatus:
                  paidTotal == 0
                    ? "purchaseLater"
                    : parseInt(totalDue) <= 0 &&
                        order.data().shippingChargeCustomer &&
                        order.data().shppingChargeCustomer !== 0
                      ? "Paid"
                      : "Partially Paid",
              });
            }
          } else {
            //  reject multiple item — supports both orders and product requests,
            //  just needs the payment status reset back to "needs payment"
            const element = paymentRequestObj.pendingOrders[i];
            const isProductRequest = !!paymentRequestObj.productRequest;
            const orderRef = isProductRequest
              ? firestore.doc(`bookingRequest/${element.bookingId}`)
              : firestore.doc(`ordersApi/${element.orderId}`);
            const order = await orderRef.get();

            await orderRef.update({
              paymentStatus: isProductRequest ? "" : "purchaseLater",
            });
          }
        }
      }

      await paymentRequestRef.update({
        status: paymentRequestObj.status,
      });

      const updatedPaymentRequestObj = await paymentRequestRef.get();
      return updatedPaymentRequestObj.data();
    } catch (error) {
      alert(error);
      return null;
    }
  } else {
    return null;
  }
};
export const updateRefundRequestOrderStatus = async (refundRequestObj) => {
  const refundRequestRef = firestore.doc(
    `refundRequest/${refundRequestObj.refundId}`,
  );
  let date = new Date();
  const snapshot = await refundRequestRef.get();
  if (snapshot.exists) {
    try {
      /* Ship For Me after-sale claims from the customer app — same writes as
         the other two branches, against the shipForMe booking. */
      if (refundRequestObj.shipmentRequest) {
        const element = refundRequestObj.order;
        const bookingRef = firestore.doc(`shipForMe/${element.bookingId}`);
        const booking = await bookingRef.get();
        const amount = parseFloat(refundRequestObj.refundAmount);
        await bookingRef.update({
          refundStatus:
            refundRequestObj.status == "reject" ? "rejected" : "given",
          refund: (parseFloat(booking.data().refund) || 0) + (amount > 0 ? amount : 0),
          refundNote: refundRequestObj.reason
            ? refundRequestObj.reason
            : booking.data().refundNote || "",
        });
        await refundRequestRef.update({
          status: refundRequestObj.status,
          ...(refundRequestObj.status !== "reject" && amount > 0
            ? { refundAmount: amount }
            : {}),
        });
        if (refundRequestObj.status !== "reject") {
          let expenseObj = {
            id: `${date.getTime().toString()}`,
            category: "REFUND",
            subCategory: "Ship For Me",
            month: getMonthName(),
            date: date.toLocaleDateString("en-GB"),
            note: `Order Id: ${element.bookingId}`,
            amount: amount || 0,
            receiveBy: "admin",
            status: "pending",
            unEditable: true,
          };
          const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
          expenseRef.set(expenseObj);
        }
        const updatedRefundRequestObj = await refundRequestRef.get();
        return updatedRefundRequestObj.data();
      }
      if (refundRequestObj.productRequest) {
        const element = refundRequestObj.order;
        const orderRef = firestore.doc(`bookingRequest/${element.bookingId}`);
        const order = await orderRef.get();
        await orderRef.update({
          refundStatus:
            refundRequestObj.status == "reject" ? "rejected" : "given",
          /* Running total: an after-sale refund on top of an earlier one
             adds to it instead of replacing it. */
          refund:
            (parseFloat(order.data().refund) || 0) +
            (parseFloat(refundRequestObj.refundAmount) > 0
              ? parseFloat(refundRequestObj.refundAmount)
              : 0),
          refundNote: refundRequestObj.reason
            ? refundRequestObj.reason
            : order.data().refundNote
              ? order.data().refundNote
              : "",
        });

        /* Keep the approved amount on the request too, so the refund
           queues and any later audit can see what was paid out. */
        await refundRequestRef.update({
          status: refundRequestObj.status,
          ...(refundRequestObj.status !== "reject" &&
          parseFloat(refundRequestObj.refundAmount) > 0
            ? { refundAmount: parseFloat(refundRequestObj.refundAmount) }
            : {}),
        });
        if (refundRequestObj.status !== "reject") {
          let expenseObj = {
            id: `${date.getTime().toString()}`,
            category: "REFUND",
            subCategory: "Product Request",
            month: getMonthName(),
            date: date.toLocaleDateString("en-GB"),
            note: `Order Id: ${element.bookingId}`,
            amount: parseFloat(refundRequestObj.refundAmount) || 0,
            receiveBy: "admin",
            status: "pending",
            unEditable: true,
          };
          const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
          expenseRef.set(expenseObj);
        }
        const updatedRefundRequestObj = await refundRequestRef.get();
        return updatedRefundRequestObj.data();
      } else {
        const element = refundRequestObj.order;
        const orderRef = firestore.doc(`ordersApi/${element.orderId}`);
        const order = await orderRef.get();
        await orderRef.update({
          refundStatus:
            refundRequestObj.status == "reject" ? "rejected" : "given",
          /* Running total: an after-sale refund on top of an earlier one
             adds to it instead of replacing it. */
          refund:
            (parseFloat(order.data().refund) || 0) +
            (parseFloat(refundRequestObj.refundAmount) > 0
              ? parseFloat(refundRequestObj.refundAmount)
              : 0),
          refundNote: refundRequestObj.reason
            ? refundRequestObj.reason
            : order.data().refundNote
              ? order.data().refundNote
              : "",
        });

        /* Keep the approved amount on the request too, so the refund
           queues and any later audit can see what was paid out. */
        await refundRequestRef.update({
          status: refundRequestObj.status,
          ...(refundRequestObj.status !== "reject" &&
          parseFloat(refundRequestObj.refundAmount) > 0
            ? { refundAmount: parseFloat(refundRequestObj.refundAmount) }
            : {}),
        });
        if (refundRequestObj.status !== "reject") {
          let expenseObj = {
            id: `${date.getTime().toString()}`,
            category: "REFUND",
            subCategory: "1688 Orders",
            month: getMonthName(),
            date: date.toLocaleDateString("en-GB"),
            note: `Order Id: ${element.orderId}`,
            amount: parseFloat(refundRequestObj.refundAmount) || 0,
            receiveBy: "admin",
            status: "pending",
            unEditable: true,
          };
          const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
          expenseRef.set(expenseObj);
        }
        const updatedRefundRequestObj = await refundRequestRef.get();
        return updatedRefundRequestObj.data();
      }
    } catch (error) {
      alert(error);
      return null;
    }
  } else {
    return null;
  }
};
/* Where a direct refund lands, per record type. The three refundable things
   live in three collections and are keyed differently, and each books its
   cash-out under its own expense sub-category. */
const REFUND_TARGETS = {
  order: {
    collection: "ordersApi",
    idField: "orderId",
    subCategory: "1688 Orders",
  },
  productRequest: {
    collection: "bookingRequest",
    idField: "bookingId",
    subCategory: "Product Request",
  },
  shipmentRequest: {
    collection: "shipForMe",
    idField: "bookingId",
    subCategory: "Ship For Me",
  },
};

/* A refund the admin issues straight against an order, product request or
   shipment booking, with no customer refund request behind it.

   It writes the same three records the approval path writes - an already
   approved row in `refundRequest`, the refund fields on the record itself, and
   the REFUND cash-out in `dailyExpenses` for the exact amount - so a direct
   refund lands in the Approved tab and in the expense books indistinguishably
   from a requested one. `quickRefund` decides which of the two pages it shows
   up on, matching getAllQuickRefundRequest / getAllAfterSale. */
export const createDirectRefund = async ({
  order,
  type,
  quickRefund,
  refundAmount,
  paymentMethod,
  reason,
  admin,
}) => {
  const target = REFUND_TARGETS[type];
  const amount = parseFloat(refundAmount);
  if (!order || !target || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const date = new Date();
  const orderId = order[target.idField];
  if (!orderId) {
    return null;
  }

  /* Same id shape as the customer-raised refunds. Retried on a collision
     rather than overwriting somebody's real refund. */
  let refundRef = null;
  let refundId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    refundId = `${Math.round(Math.random() * 1000000 - 1)}`;
    const candidate = firestore.doc(`refundRequest/${refundId}`);
    const snapshot = await candidate.get();
    if (!snapshot.exists) {
      refundRef = candidate;
      break;
    }
  }
  if (!refundRef) {
    alert("Could not allocate a refund id. Please try again.");
    return null;
  }

  try {
    const refundObj = {
      refundId,
      status: "approved",
      quickRefund: Boolean(quickRefund),
      /* productRequest is the flag the rest of the refund code already
         branches on, so it keeps its original meaning; shipmentRequest is
         additive and only ever true here. refundTarget is the unambiguous
         one for anything written from now on. */
      productRequest: type === "productRequest",
      shipmentRequest: type === "shipmentRequest",
      refundTarget: type,
      /* Marks the rows nobody asked for, so the Approved tab and any later
         audit can tell them apart from customer-raised refunds. */
      directRefund: true,
      order,
      userId: order.userId || "",
      paymentMethod: paymentMethod || "Cash",
      refundAmount: amount,
      reason: reason || "",
      admin: admin || null,
      time: date.getTime(),
      date: date.toLocaleDateString("en-GB"),
    };
    await refundRef.set(refundObj);

    /* `refund` is the running total refunded on the record — a second
       refund adds to it rather than overwriting the first, so the customer's
       "Refunded: ৳X" stays right. */
    const orderRef = firestore.doc(`${target.collection}/${orderId}`);
    const current = await orderRef.get();
    const previous = current.exists ? parseFloat(current.data().refund) || 0 : 0;
    await orderRef.update({
      refundStatus: "given",
      refund: previous + amount,
      refundNote: reason || (current.exists && current.data().refundNote) || "",
    });

    const expenseObj = {
      id: `${date.getTime().toString()}`,
      category: "REFUND",
      subCategory: target.subCategory,
      month: getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Order Id: ${orderId}`,
      amount: amount,
      receiveBy: "admin",
      status: "pending",
      unEditable: true,
    };
    const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
    await expenseRef.set(expenseObj);

    return refundObj;
  } catch (error) {
    alert(error);
    return null;
  }
};

export const updateAfterSaleStatus = async (refundRequestObj) => {
  const refundRequestRef = firestore.doc(
    `refundRequest/${refundRequestObj.refundId}`,
  );
  const snapshot = await refundRequestRef.get();
  if (snapshot.exists) {
    try {
      if (refundRequestObj.productRequest) {
        const element = refundRequestObj.order;
        const orderRef = firestore.doc(`bookingRequest/${element.bookingId}`);
        const order = await orderRef.get();
        await orderRef.update({
          refundStatus:
            refundRequestObj.status == "reject" ? "rejected" : "given",
          refund: refundRequestObj.refundAmount
            ? refundRequestObj.refundAmount
            : order.data().refund
              ? order.data().refund
              : 0,
          refundNote: refundRequestObj.reason
            ? refundRequestObj.reason
            : order.data().refundNote
              ? order.data().refundNote
              : "",
        });

        await refundRequestRef.update({
          status: refundRequestObj.status,
        });
        const updatedRefundRequestObj = await refundRequestRef.get();
        return updatedRefundRequestObj.data();
      } else {
        const element = refundRequestObj.order;
        const orderRef = firestore.doc(`ordersApi/${element.orderId}`);
        const order = await orderRef.get();
        await orderRef.update({
          refundStatus:
            refundRequestObj.status == "reject" ? "rejected" : "given",
          refund: refundRequestObj.refundAmount
            ? refundRequestObj.refundAmount
            : order.data().refund
              ? order.data().refund
              : 0,
          refundNote: refundRequestObj.reason
            ? refundRequestObj.reason
            : order.data().refundNote
              ? order.data().refundNote
              : "",
        });

        await refundRequestRef.update({
          status: refundRequestObj.status,
        });
        const updatedRefundRequestObj = await refundRequestRef.get();
        return updatedRefundRequestObj.data();
      }
    } catch (error) {
      alert(error);
      return null;
    }
  } else {
    return null;
  }
};

export const handlePurchasingCashOut = async (purchasingObj) => {
  const batch = firestore.batch();

  const transactionRef = firestore.doc(
    `transactions/${purchasingObj.paymentId}`,
  );

  // Get document snapshots

  const transactionSnapShot = await transactionRef.get();

  // Create transaction document if it doesn't exist
  if (!transactionSnapShot.exists) {
    try {
      batch.set(transactionRef, {
        id: purchasingObj.paymentId,
        amount: parseFloat(purchasingObj.buyingcost2).toFixed(2),
        employeeId: purchasingObj.employeeId,
        paidInvoice: `Invoice:${purchasingObj.id}
          Date: ${purchasingObj.orderedDate}`,
        month: getMonthName(),
        category: "Purchasing",
        subCategory: `${purchasingObj.employeeId}`,
        country: "China",
        rmbBalance: purchasingObj.rmbBalance,
        rupeeBalance: purchasingObj.rupeeBalance,
        totalRmb: purchasingObj.totalRmb,
        date: purchasingObj.date,
        expenseBy: purchasingObj.expenseBy,
        fundType: purchasingObj.fundType,
        trackingNo: purchasingObj.trackingNo,
        productImage: purchasingObj.productImage,
        productType: purchasingObj.productType,
      });
    } catch (error) {
      alert(error);
    }
  }

  // Update purchasing document

  // Commit the batch
  try {
    await batch.commit();
  } catch (error) {
    alert(error);
    return false;
  }
};

export const getAllOrdersApi = async (orderStatus, startDate, endDate) => {
  let ordersCollectionRef;
  // --- Fix date issue by setting full-day timestamps ---
  // Bangladesh calendar days, whatever time zone the admin's computer is in.
  const start = dhakaDayStart(startDate);
  const end = dhakaDayEnd(endDate);

  const startTs = firebase.firestore.Timestamp.fromDate(start);
  const endTs = firebase.firestore.Timestamp.fromDate(end);
  console.log(orderStatus);
  if (orderStatus === "Picked") {
    ordersCollectionRef = firestore
      .collection("ordersApi")
      .where("agentStatus", "==", orderStatus)
      .where("orderStatus", "==", "pending")
      .where("createdAt", ">=", startTs)
      .where("createdAt", "<=", endTs);
  } else if (orderStatus == "") {
    ordersCollectionRef = firestore
      .collection("ordersApi")
      .where("createdAt", ">=", startTs)
      .where("createdAt", "<=", endTs);
  } else {
    ordersCollectionRef = firestore
      .collection("ordersApi")
      .where("orderStatus", "==", orderStatus)
      .where("createdAt", ">=", startTs)
      .where("createdAt", "<=", endTs);
  }
  // try {
  const orders = await ordersCollectionRef.get();
  const ordersArray = [];
  orders.forEach((doc) => {
    ordersArray.push(doc.data());
  });
  return ordersArray;
  // } catch (error) {
  //   alert(error);
  // }
};
export const getAllOrdersByTrackingNo = async (trackingNo) => {
  let ordersCollectionRef;

  ordersCollectionRef = firestore
    .collection("ordersApi")
    .where("trackingNo", "==", trackingNo);
  try {
    const orders = await ordersCollectionRef.get();
    const ordersArray = [];
    orders.forEach((doc) => {
      ordersArray.push(doc.data());
    });
    return ordersArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllOrdersByAgentId = async (agent, month) => {
  let ordersCollectionRef;
  console.log(agent);
  console.log(month);
  ordersCollectionRef = firestore
    .collection("ordersApi")
    .where("agentId", "==", agent)
    .where("month", "==", month);
  try {
    const orders = await ordersCollectionRef.get();
    const ordersArray = [];
    orders.forEach((doc) => {
      ordersArray.push(doc.data());
    });
    return ordersArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllOrdersByCartonNo = async (cartonId) => {
  let ordersCollectionRef;

  ordersCollectionRef = firestore
    .collection("ordersApi")
    .where("chinseseCartonId", "==", cartonId);
  try {
    const orders = await ordersCollectionRef.get();
    const ordersArray = [];
    orders.forEach((doc) => {
      ordersArray.push(doc.data());
    });
    return ordersArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllOrdersByCartonNo2 = async (cartonId) => {
  let ordersCollectionRef;

  ordersCollectionRef = firestore
    .collection("ordersApi")
    .where("bdCartonId", "==", cartonId);
  try {
    const orders = await ordersCollectionRef.get();
    const ordersArray = [];
    orders.forEach((doc) => {
      ordersArray.push(doc.data());
    });
    return ordersArray;
  } catch (error) {
    alert(error);
  }
};
export const getAllRooms = async () => {
  const roomsCollectionRef = firestore.collection("rooms");

  try {
    const rooms = await roomsCollectionRef.get();
    const roomsArray = [];
    rooms.forEach((doc) => {
      roomsArray.push(doc.data());
    });
    return roomsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};
export const readAllMessage = async (roomId) => {
  const roomRef = firestore.doc(`rooms/${roomId}`);
  const room = await roomRef.get();
  roomRef.update({
    messages: room.data().messages.map((message) => {
      if (message.user._id == roomId) {
        return { ...message, sent: true, received: true };
      } else {
        return message;
      }
    }),
    lastMessage: { ...room.data().lastMessage, sent: true, received: true },
  });
};

export const updateOrderApi = async (order) => {
  const orderRef = firestore.doc(`ordersApi/${order.orderId}`);
  const snapShot = await orderRef.get();
  if (snapShot.exists) {
    try {
      await orderRef.update({ ...order });
      const updatedOrder = await orderRef.get();
      return updatedOrder.data();
    } catch (error) {
      console.log("error creating orders", error.message);
      return;
    }
  } else {
    alert("No order was found to be updated");
  }
};

export const updateAllOrdersApi = () => {
  firestore
    .collection("ordersApi")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        doc.ref.update({
          createdAt: firebase.firestore.Timestamp.fromMillis(doc.data().time),
        });
      });
    });
};

export const updateOrdersWithPaymentLink = async (
  totalRmb,
  orders,
  paymentLink,
) => {
  try {
    console.log("firebase function is getting called!");
    const batch = firebase.firestore().batch();
    const paymentLinkId = Date.now().toString();
    const paymentLinksRef = firebase
      .firestore()
      .collection("paymentLinks1688")
      .doc(paymentLinkId);
    // Document data
    const paymentLinkData = {
      createdAt: firebase.firestore.Timestamp.now(),
      paymentId: paymentLinkId,
      date: new Date().toLocaleDateString("en-GB"),
      paymentLink: paymentLink,
      totalRmb: totalRmb,
      linkStatus: "Not Paid",
      rmbStatus: "Not Paid",
      orders: orders,
      // any other fields you need
    };
    batch.set(paymentLinksRef, paymentLinkData);
    // Example: update orders in the batch
    orders.forEach((order) => {
      const orderRef = firebase
        .firestore()
        .collection("ordersApi")
        .doc(`${order.orderId}`);
      batch.update(orderRef, {
        paymentLink1688: paymentLink,
        paymentLinkId: paymentLinkId,
      });
    });
    await batch.commit();
    return orders;
  } catch (err) {
    console.log(err);
    return [];
  }
};
/* Applies the field diffs built by build1688OrderUpdate - the actual cost
 * figures plus, when 1688 says the order has moved on, the new orderStatus.
 * Only the keys present on each row are written, and build1688OrderUpdate
 * whitelists those, so a stale in-memory order can never clobber the rest of
 * the document. Firestore caps a batch at 500 writes, hence the chunking. */
export const updateOrdersFrom1688 = async (updates) => {
  try {
    const chunkSize = 400;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const batch = firebase.firestore().batch();
      updates.slice(i, i + chunkSize).forEach((update) => {
        const { orderId, ...fields } = update;
        if (Object.keys(fields).length === 0) return;
        const orderRef = firebase
          .firestore()
          .collection("ordersApi")
          .doc(`${orderId}`);
        batch.update(orderRef, fields);
      });
      await batch.commit();
    }
    return updates;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const updateOrdersWithTrackingNo = async (orders) => {
  try {
    console.log("firebase function is getting called!");
    const batch = firebase.firestore().batch();

    // Example: update orders in the batch
    orders.forEach((order) => {
      const orderRef = firebase
        .firestore()
        .collection("ordersApi")
        .doc(`${order.orderId}`);
      batch.update(orderRef, {
        trackingNo: order.trackingNo,
      });
    });
    await batch.commit();
    return orders;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const deleteOrderApi = async (order) => {
  const orderRef = firestore.doc(`ordersApi/${order.orderId}`);
  const snapShot = await orderRef.get();
  if (snapShot.exists) {
    try {
      await orderRef.delete();
    } catch (error) {
      console.log("error creating orders", error.message);
      return;
    }
  }
};
export const deleteProductRequest = async (order) => {
  const orderRef = firestore.doc(`bookingRequest/${order.bookingId}`);
  const snapShot = await orderRef.get();
  /* Deleting a request that is in a payment batch would leave the batch
     holding a stale copy and an inflated total. */
  if (snapShot.exists && snapShot.data().productRequestPaymentId) {
    alert(
      "This request is in a payment batch and cannot be deleted. Remove it from the batch first."
    );
    return;
  }
  if (snapShot.exists) {
    try {
      await orderRef.delete();
    } catch (error) {
      console.log("error creating orders", error.message);
      return;
    }
  }
};
export const getCurrency = async () => {
  const currencyRef = firestore.doc("Currency/taka");
  try {
    const currency = await currencyRef.get();
    return currency.data();
  } catch (error) {
    alert(error);
  }
};

export const makePayment = async (
  total,
  invoicesToPay,
  currentUser,
  admin,
  parcelsArray,
  paymentMethod,
) => {
  try {
    const res = await firestore.runTransaction(async (t) => {
      //first create a payment object
      const paymentObj = {
        paymentId: Math.floor(Math.random() * Date.now()),
        paidAt: new Date().toLocaleDateString("en-US").replaceAll("/", "-"),
        amount: total,
        paymentMethod,
        paidInvoice: [...invoicesToPay],
        approvedBy: admin.name,
      };

      // for transaction all reads should be done before all writes
      const paymentDayRef = firestore.doc(`paymentDays/${paymentObj.paidAt}`);
      const paymentDay = await t.get(paymentDayRef);
      const paymentHistoryRef = firestore.doc(
        `paymentHistory/${paymentObj.paymentId}`,
      );
      const paymentHistory = await t.get(paymentHistoryRef);
      // updatating the status invoiceStatus=Paid in parcelArray in admin
      parcelsArray.forEach(async (parcel) => {
        const orderRef = firestore.doc(`orders/${parcel.parcelId}`);
        await t.update(orderRef, {
          ...parcel,
          invoiceStatus: "Paid",
        });
      });

      // make all writes
      // make a payment in paymentdays
      console.log(paymentDay.data());
      const day = getDay();
      if (!paymentDay.exists) {
        t.set(paymentDayRef, {
          date: paymentObj.paidAt,
          total: total,
          day,
        });
      } else {
        t.update(paymentDayRef, {
          total: paymentDay.data().total + total,
        });
      }
      console.log(paymentDay.data());

      // make a payment in paymentHistory

      console.log(paymentHistory.data());
      if (!paymentHistory.exists) {
        t.set(paymentHistoryRef, {
          Email: currentUser
            ? currentUser.email && currentUser.email
            : admin.email,
          Name: currentUser
            ? currentUser.displayName && currentUser.displayName
            : admin.name,
          Id: currentUser ? currentUser.userId : "admin",
          uid: currentUser ? currentUser.uid : admin.adminId,
          Mobile: currentUser
            ? currentUser.mobileNo
              ? currentUser.mobileNo
              : ""
            : admin.mobileNo,
          ...paymentObj,
          day,
        });
      } else {
        alert("Your paymentId already exist. please try again later.");
      }
      console.log(paymentHistory.data());

      const newArray = parcelsArray.map((parcel) => {
        return { ...parcel, invoiceStatus: "Paid" };
      });

      console.log(parcelsArray[0]);
      console.log(newArray[0]);
      return newArray;
    });
    return res;
  } catch (e) {
    console.log("Transaction failure:", e);
    alert("Transaction failure");
    return [];
  }
};

const getDay = () => {
  const t = new Date();
  const dayInDigit = t.getDay();
  let day;
  if (dayInDigit == 0) {
    day = "Sunday";
  }
  if (dayInDigit == 1) {
    day = "Monday";
  }
  if (dayInDigit == 2) {
    day = "Tuesday";
  }
  if (dayInDigit == 3) {
    day = "Wednesday";
  }
  if (dayInDigit == 4) {
    day = "Thursday";
  }
  if (dayInDigit == 5) {
    day = "Friday";
  }
  if (dayInDigit == 6) {
    day = "Saturday";
  }
  return day;
};

export const getMultipleOrders = async (parcelIdArray) => {
  const ordersArray = [];
  for (let i = 0; i < parcelIdArray.length; i++) {
    const orderRef = firestore.doc(`orders/${parcelIdArray[i]}`);
    const snapShot = await orderRef.get();
    ordersArray.push(snapShot.data());
  }
  return ordersArray;
};
export const getAllD2DRates = async (freightType, country) => {
  let d2dRatesCollectionRef = firestore.collection(
    `d2d-rates-${freightType}-${country}`,
  );
  try {
    const d2dRates = await d2dRatesCollectionRef.get();
    const d2dRatesArray = [];
    d2dRates.forEach((doc) => {
      d2dRatesArray.push(doc.data());
    });
    return d2dRatesArray;
  } catch (error) {
    alert(error);
  }
};
export const getAll1688Rates = async (freightType, country) => {
  let d2dRatesCollectionRef = firestore.collection(`1688Category`);
  try {
    const d2dRates = await d2dRatesCollectionRef.get();
    const d2dRatesArray = [];
    d2dRates.forEach((doc) => {
      d2dRatesArray.push(doc.data());
    });
    return d2dRatesArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadD2DRates = async (freightType, country, typeObj) => {
  const productTypeRef = firestore.doc(
    `d2d-rates-${freightType}-${country}/${typeObj.id}`,
  );
  const snapShot = await productTypeRef.get();
  if (!snapShot.exists) {
    try {
      await productTypeRef.set({
        ...typeObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await productTypeRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    await productTypeRef.update({
      ...typeObj,
    });
    const uploadedSnapShot2 = await productTypeRef.get();
    return uploadedSnapShot2.data();
  }
};

export const updateD2DRates = async (freightType, country, productTypeObj) => {
  const productTypeRef = firestore.doc(
    `d2d-rates-${freightType}-${country}/${productTypeObj.id}`,
  );
  try {
    await productTypeRef.update({ ...productTypeObj });
    const snapShot = await productTypeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const update1688Rates = async (productTypeObj) => {
  const productTypeRef = firestore.doc(`1688Category/${productTypeObj.id}`);
  try {
    await productTypeRef.update({ ...productTypeObj });
    const snapShot = await productTypeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};
export const updateAll1688Rates = async (
  airPrice = "900",
  seaPrice = "300",
) => {
  const querySnapshot = await firestore.collection("1688Category").get();
  const air = String(airPrice);
  const sea = String(seaPrice);

  for (let doc of querySnapshot.docs) {
    await doc.ref.update({
      // Air tiers (Parcel / Below 5kg / Above 5kg / Above 100kg)
      parcel: air,
      ten: air,
      eleven: air,
      above_100kg: air,
      // Sea tiers (100kg / Below 1000kg / Above 1000kg)
      "100kg": sea,
      below_1000kg: sea,
      above_1000kg: sea,
    });
  }
};

// One-off cleanup: strips the unused legacy fields (Shipping Company + the
// "SC" reference-cost columns) that were copy-pasted from the country-based
// d2d-rates schema but were never actually editable/used on the 1688Category
// collection.
export const removeLegacy1688RateFields = async () => {
  const querySnapshot = await firestore.collection("1688Category").get();

  for (let doc of querySnapshot.docs) {
    await doc.ref.update({
      shippingCompany: firebase.firestore.FieldValue.delete(),
      alg_100kg: firebase.firestore.FieldValue.delete(),
      algBelow_1000kg: firebase.firestore.FieldValue.delete(),
      algAbove_1000kg: firebase.firestore.FieldValue.delete(),
    });
  }
};

export const deleteD2DRates = async (freightType, country, id) => {
  const productTypeRef = firestore.doc(
    `d2d-rates-${freightType}-${country}/${id}`,
  );
  const snapShot = await productTypeRef.get();
  console.log(snapShot.data());
  try {
    await productTypeRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getAllCoupons = async () => {
  const productsCollectionRef = firestore.collection("coupons");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadCoupon = async (productObj) => {
  const productRef = firestore.doc(`coupons/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj, file: "" };
  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...newProductObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a coupon with similar id");
  }
};

export const updateCoupon = async (productObj) => {
  const productRef = firestore.doc(`coupons/${productObj.id}`);
  const product = await productRef.get();
  try {
    delete productObj.file;
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteCoupon = async (id) => {
  const productRef = firestore.doc(`coupons/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const getAllPartials = async () => {
  const productsCollectionRef = firestore.collection("partial-payments");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadPartial = async (productObj) => {
  const productsRef = firestore.collection("partial-payments");
  const products = await productsRef.get();
  products.forEach(async (doc) => {
    const proRef = firestore.doc(`partial-payments/${doc.id}`);
    await proRef.delete();
  });
  const productRef = firestore.doc(`partial-payments/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj, file: "" };
  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...newProductObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a coupon with similar id");
  }
};

export const updatePartial = async (productObj) => {
  const productRef = firestore.doc(`partial-payments/${productObj.id}`);
  const product = await productRef.get();
  try {
    delete productObj.file;
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deletePartial = async (id) => {
  const productRef = firestore.doc(`partial-payments/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getAllSiteDiscounts = async () => {
  const productsCollectionRef = firestore.collection("site-discount");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadSiteDiscount = async (productObj) => {
  const productsRef = firestore.collection("site-discount");
  const products = await productsRef.get();
  products.forEach(async (doc) => {
    const proRef = firestore.doc(`site-discount/${doc.id}`);
    await proRef.delete();
  });
  const productRef = firestore.doc(`site-discount/${productObj.id}`);
  const snapShot = await productRef.get();
  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...productObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a site discount with similar id");
  }
};

export const updateSiteDiscount = async (productObj) => {
  const productRef = firestore.doc(`site-discount/${productObj.id}`);
  try {
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteSiteDiscount = async (id) => {
  const productRef = firestore.doc(`site-discount/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const getAllWarehouses = async () => {
  const productsCollectionRef = firestore.collection("warehouses");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadWarehouse = async (warehouseObj) => {
  const productRef = firestore.doc(`warehouses/${warehouseObj.id}`);
  const snapShot = await productRef.get();

  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...warehouseObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a warehouse with similar id");
  }
};

export const updateWarehouse = async (warehouseObj) => {
  const productRef = firestore.doc(`warehouses/${warehouseObj.id}`);
  try {
    await productRef.update({ ...warehouseObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteWarehouse = async (id) => {
  const productRef = firestore.doc(`warehouses/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const uploadImageRechargeRequest = async (file) => {
  const imageRef = storage.ref(`rechargeRequests/${file.name}`);

  try {
    await imageRef.put(file);
    var imgUrl = [];
    await imageRef.getDownloadURL().then((url) => {
      console.log(url);
      imgUrl.push(url);
    });
    return imgUrl[0];
  } catch (error) {
    return null;
  }
};

export const get1688PaymentsByDateRange = async (
  startDate,
  endDate,
  linkStatus,
  rmbStatus,
) => {
  // --- Fix date issue by setting full-day timestamps ---
  // Bangladesh calendar days, whatever time zone the admin's computer is in.
  const start = dhakaDayStart(startDate);
  const end = dhakaDayEnd(endDate);

  const startTs = firebase.firestore.Timestamp.fromDate(start);
  const endTs = firebase.firestore.Timestamp.fromDate(end);

  // --- Start building Firestore query ---
  let query = firebase
    .firestore()
    .collection("paymentLinks1688")
    .where("createdAt", ">=", startTs)
    .where("createdAt", "<=", endTs);

  // --- OPTIONAL: linkStatus ---
  if (linkStatus && linkStatus.trim() !== "") {
    query = query.where("linkStatus", "==", linkStatus);
  }

  // --- OPTIONAL: rmbStatus ---
  if (rmbStatus && rmbStatus.trim() !== "") {
    query = query.where("rmbStatus", "==", rmbStatus);
  }

  // --- Execute final query ---
  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
export const updatepaymentLink1688 = async (
  paymentObj,
  rmbRate,
  totalRmb,
  imageUrl,
) => {
  try {
    const batch = firebase.firestore().batch();
    const paymentLinksRef = firebase
      .firestore()
      .collection("paymentLinks1688")
      .doc(paymentObj.paymentId);

    batch.update(paymentLinksRef, {
      rmbStatus: "Paid",
      rmbRate,
      totalRmbPaid: totalRmb,
      receipt: imageUrl,
    });
    // Example: update orders in the batch
    paymentObj.orders.forEach((order) => {
      const orderRef = firebase
        .firestore()
        .collection("ordersApi")
        .doc(`${order.orderId}`);
      batch.update(orderRef, { exchangeRate: rmbRate });
    });
    let date = new Date();
    let expenseObj = {
      id: `${date.getTime().toString()}`,
      category: "RMB",
      subCategory: "1688 Orders",
      month: getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Payment Id: ${paymentObj.paymentId}, Total Rmb: ${totalRmb}, rmb Rate:${rmbRate}`,
      amount: parseInt(totalRmb * rmbRate),
      receiveBy: "admin",
      status: "pending",
      unEditable: true,
    };
    const expenseRef = firestore.doc(`dailyExpenses/${expenseObj.id}`);
    batch.set(expenseRef, expenseObj);
    await batch.commit();
    return paymentObj;
  } catch (error) {
    return null;
  }
};
export const updatepaymentLink = async (paymentObj) => {
  try {
    const batch = firebase.firestore().batch();
    const paymentLinksRef = firebase
      .firestore()
      .collection("paymentLinks1688")
      .doc(paymentObj.paymentId);

    batch.update(paymentLinksRef, {
      paymentLink: paymentObj.paymentLink,
    });

    await batch.commit();
    return paymentObj;
  } catch (error) {
    return null;
  }
};

// Removes a single order from a 1688 payment link (used when link generation
// fails because one of the bundled orders is no longer payable) and marks
// that order as removed so it shows up flagged on the Picked Orders page.
export const removeOrderFromPaymentLink = async (paymentObj, orderToRemove) => {
  try {
    const batch = firebase.firestore().batch();
    const paymentLinksRef = firebase
      .firestore()
      .collection("paymentLinks1688")
      .doc(paymentObj.paymentId);

    const remainingOrders = paymentObj.orders.filter(
      (order) => order.orderNumber !== orderToRemove.orderNumber,
    );
    const removedAmount = orderToRemove.creationTime1688
      ? parseFloat(orderToRemove.creationTime1688.totalSuccessAmount || 0)
      : 0;
    const newTotalRmb = Math.max(
      0,
      parseFloat(paymentObj.totalRmb || 0) - removedAmount,
    );

    batch.update(paymentLinksRef, {
      orders: remainingOrders,
      totalRmb: newTotalRmb,
    });

    if (orderToRemove.orderId) {
      const orderRef = firebase
        .firestore()
        .collection("ordersApi")
        .doc(`${orderToRemove.orderId}`);
      batch.update(orderRef, {
        removedFromPaymentLink: true,
        paymentLink1688: "",
        paymentLinkId: "",
      });
    }

    await batch.commit();
    return remainingOrders;
  } catch (error) {
    console.error("removeOrderFromPaymentLink failed", error);
    return null;
  }
};

/* ---------------------------------------------------------------------------
 * Product Request purchase batches.
 *
 * The 1688 twin of this lives just above (paymentLinks1688). Product requests
 * have no 1688 API, so there is no payment link and no linkStatus - the batch
 * is just a grouping with an RMB total the admin pays against.
 * ------------------------------------------------------------------------- */

/* Creates the batch and stamps every member, atomically.
 *
 * A transaction rather than a batch: the "is it already in a batch" re-read and
 * the write have to be atomic, or two admins batching at the same moment could
 * both claim the same request. Returns the accepted requests plus whatever was
 * skipped and why, so the caller can report a partial success.
 */
export const createProductRequestPayment = async (requests, createdBy) => {
  if (!requests || requests.length === 0) {
    return { ok: false, skipped: [], reason: "empty" };
  }
  /* A batch commit caps at 500 writes and each member costs one. */
  if (requests.length > 400) {
    return { ok: false, skipped: [], reason: "too-many" };
  }

  const paymentId = Date.now().toString();
  const date = new Date();
  const dateString = date.toLocaleDateString("en-GB");

  try {
    return await firestore.runTransaction(async (transaction) => {
      /* Firestore transactions require every read before any write. */
      const snapshots = [];
      for (let i = 0; i < requests.length; i++) {
        const ref = firestore.doc(`bookingRequest/${requests[i].bookingId}`);
        snapshots.push({ ref, snapshot: await transaction.get(ref) });
      }

      const accepted = [];
      const skipped = [];
      snapshots.forEach(({ ref, snapshot }, index) => {
        const bookingId = requests[index].bookingId;
        if (!snapshot.exists) {
          skipped.push({ bookingId, reason: "missing" });
          return;
        }
        const fresh = snapshot.data();
        if (fresh.productRequestPaymentId) {
          skipped.push({
            bookingId,
            reason: "already-in-batch",
            existingPaymentId: fresh.productRequestPaymentId,
          });
          return;
        }
        /* Re-read the amount from the server, not the client's copy. */
        const batchedRmb = parseRmbValue(fresh.purchasingRmb);
        if (batchedRmb <= 0) {
          skipped.push({ bookingId, reason: "no-rmb" });
          return;
        }
        accepted.push({ ref, request: { ...fresh, batchedRmb } });
      });

      if (accepted.length === 0) {
        return { ok: false, skipped, reason: "all-skipped" };
      }

      const acceptedRequests = accepted.map((entry) => entry.request);
      const totalRmb = acceptedRequests.reduce(
        (total, request) => total + request.batchedRmb,
        0,
      );

      const paymentObj = {
        createdAt: firebase.firestore.Timestamp.now(),
        paymentId,
        date: dateString,
        totalRmb,
        rmbStatus: "Not Paid",
        createdBy: createdBy || "admin",
        requestIds: acceptedRequests.map((request) => request.bookingId),
        requests: acceptedRequests,
      };

      transaction.set(
        firestore.doc(`productRequestPayments/${paymentId}`),
        paymentObj,
      );
      accepted.forEach(({ ref, request }) => {
        transaction.update(ref, {
          productRequestPaymentId: paymentId,
          productRequestPaymentDate: dateString,
          batchedRmb: request.batchedRmb,
        });
      });

      return {
        ok: true,
        paymentObj,
        skipped,
        acceptedRequests: acceptedRequests.map((request) => ({
          ...request,
          productRequestPaymentId: paymentId,
          productRequestPaymentDate: dateString,
        })),
      };
    });
  } catch (error) {
    console.error("createProductRequestPayment failed", error);
    return { ok: false, skipped: [], reason: "error" };
  }
};

export const getProductRequestPaymentsByDateRange = async (
  startDate,
  endDate,
  rmbStatus,
) => {
  /* Bangladesh calendar days, whatever time zone the admin's computer is in. */
  const start = dhakaDayStart(startDate);
  const end = dhakaDayEnd(endDate);

  let query = firestore
    .collection("productRequestPayments")
    .where("createdAt", ">=", firebase.firestore.Timestamp.fromDate(start))
    .where("createdAt", "<=", firebase.firestore.Timestamp.fromDate(end));

  if (rmbStatus) {
    query = query.where("rmbStatus", "==", rmbStatus);
  }

  try {
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    /* A createdAt range plus an rmbStatus equality needs a composite index;
       Firestore logs a one-click create link with this error. */
    console.error("getProductRequestPaymentsByDateRange failed", error);
    alert(error);
    return [];
  }
};

export const getSingleProductRequestPayment = async (paymentId) => {
  try {
    const doc = await firestore
      .doc(`productRequestPayments/${paymentId}`)
      .get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error("getSingleProductRequestPayment failed", error);
    return null;
  }
};

/* Marks the batch paid, stamps the rate onto every member and books the
 * expense. Refuses a second run so a double click cannot book twice. */
export const payProductRequestPayment = async (
  paymentObj,
  rmbRate,
  totalRmb,
  imageUrl,
  paidBy,
) => {
  if (!paymentObj || paymentObj.rmbStatus === "Paid") {
    return null;
  }
  try {
    const batch = firebase.firestore().batch();
    const date = new Date();

    const paid = {
      rmbStatus: "Paid",
      rmbRate,
      totalRmbPaid: totalRmb,
      receipt: imageUrl,
      paidAt: firebase.firestore.Timestamp.now(),
      paidBy: paidBy || "admin",
    };
    batch.update(
      firestore.doc(`productRequestPayments/${paymentObj.paymentId}`),
      paid,
    );

    (paymentObj.requests || []).forEach((request) => {
      /* set/merge, not update: update() on a request that has since been
         deleted would fail the entire commit. */
      batch.set(
        firestore.doc(`bookingRequest/${request.bookingId}`),
        { exchangeRate: rmbRate },
        { merge: true },
      );
    });

    const expenseId = date.getTime().toString();
    batch.set(firestore.doc(`dailyExpenses/${expenseId}`), {
      id: expenseId,
      category: "RMB",
      subCategory: "Product Request",
      month: getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Payment Id: ${paymentObj.paymentId}, Total Rmb: ${totalRmb}, rmb Rate: ${rmbRate}`,
      amount: parseInt(totalRmb * rmbRate),
      receiveBy: "admin",
      status: "pending",
      unEditable: true,
    });

    await batch.commit();
    return { ...paymentObj, ...paid };
  } catch (error) {
    console.error("payProductRequestPayment failed", error);
    alert(error);
    return null;
  }
};

/* Frees a request from its batch. The total is recomputed by SUMMING what is
 * left rather than subtracting the removed amount - subtraction drifts if the
 * source purchasingRmb changed after batching. */
export const removeRequestFromProductRequestPayment = async (
  paymentObj,
  requestToRemove,
) => {
  if (!paymentObj || !requestToRemove) {
    return { ok: false, reason: "invalid" };
  }
  /* The expense is already booked; silently changing the total would desync
     the books. */
  if (paymentObj.rmbStatus === "Paid") {
    return { ok: false, reason: "already-paid" };
  }
  const remaining = (paymentObj.requests || []).filter(
    (request) => request.bookingId !== requestToRemove.bookingId,
  );
  if (remaining.length === 0) {
    return { ok: false, reason: "last-request" };
  }

  try {
    const batch = firebase.firestore().batch();
    const totalRmb = remaining.reduce(
      (total, request) => total + parseRmbValue(request.batchedRmb),
      0,
    );

    batch.update(firestore.doc(`productRequestPayments/${paymentObj.paymentId}`), {
      requests: remaining,
      requestIds: remaining.map((request) => request.bookingId),
      totalRmb,
    });
    batch.set(
      firestore.doc(`bookingRequest/${requestToRemove.bookingId}`),
      {
        productRequestPaymentId: "",
        productRequestPaymentDate: "",
        batchedRmb: 0,
      },
      { merge: true },
    );

    await batch.commit();
    return { ok: true, remainingRequests: remaining, totalRmb };
  } catch (error) {
    console.error("removeRequestFromProductRequestPayment failed", error);
    return { ok: false, reason: "error" };
  }
};

/* Clears every marker then drops the batch. Refused once paid. */
export const deleteProductRequestPayment = async (paymentObj) => {
  if (!paymentObj) return { ok: false, reason: "invalid" };
  if (paymentObj.rmbStatus === "Paid") {
    return { ok: false, reason: "already-paid" };
  }
  try {
    const batch = firebase.firestore().batch();
    (paymentObj.requests || []).forEach((request) => {
      batch.set(
        firestore.doc(`bookingRequest/${request.bookingId}`),
        {
          productRequestPaymentId: "",
          productRequestPaymentDate: "",
          batchedRmb: 0,
        },
        { merge: true },
      );
    });
    batch.delete(
      firestore.doc(`productRequestPayments/${paymentObj.paymentId}`),
    );
    await batch.commit();
    return { ok: true };
  } catch (error) {
    console.error("deleteProductRequestPayment failed", error);
    return { ok: false, reason: "error" };
  }
};

export const getAllBanners = async () => {
  const productsCollectionRef = firestore.collection("banners");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadBanner = async (productObj) => {
  const productRef = firestore.doc(`banners/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj, file: "" };
  if (productObj.secondBanner) {
    const collectionRef = firestore
      .collection(`banners`)
      .where("secondBanner", "==", true);
    const collection = await collectionRef.get();
    collection.forEach(async (doc) => {
      const bannerRef = firestore.doc(`banners/${doc.data().id}`);
      await bannerRef.update({
        secondBanner: false,
      });
    });
  }
  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...newProductObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a category with similar id");
  }
};

export const createNotice = async (noticeObj) => {
  const noticeRef = firestore.doc(`notices/${noticeObj.id}`);
  const snapShot = await noticeRef.get();
  if (!snapShot.exists) {
    try {
      await noticeRef.set({
        ...noticeObj,
      });

      const uploadedSnapShot = await noticeRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a Notice with similar Id, please try again later");
  }
};

export const getAllNotices = async () => {
  const noticesCollectionRef = firestore.collection("notices");
  try {
    const notices = await noticesCollectionRef.get();
    const noticesArray = [];
    notices.forEach((doc) => {
      noticesArray.push(doc.data());
    });
    return noticesArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const getAllComplaints = async () => {
  const complaintsCollectionRef = firestore.collection("complain");
  try {
    const complaints = await complaintsCollectionRef.get();
    const complaintsArray = [];
    complaints.forEach((doc) => {
      complaintsArray.push(doc.data());
    });
    return complaintsArray.sort((a, b) => b.time - a.time);
  } catch (error) {
    alert(error);
  }
};

export const updateComplaintStatus = async (complaintId, status) => {
  const complaintRef = firestore.doc(`complain/${complaintId}`);
  try {
    await complaintRef.update({ status });
    const updated = await complaintRef.get();
    return updated.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteNotice = async (id) => {
  const noticeRef = firestore.doc(`notices/${id}`);
  try {
    await noticeRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const updateNotice = async (noticeObj) => {
  const noticeRef = firestore.doc(`notices/${noticeObj.id}`);
  try {
    await noticeRef.update({ ...noticeObj });
    const snapShot = await noticeRef.get();
    return snapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const updateBanner = async (productObj) => {
  const productRef = firestore.doc(`banners/${productObj.id}`);
  const product = await productRef.get();
  if (productObj.secondBanner) {
    const collectionRef = firestore
      .collection(`banners`)
      .where("secondBanner", "==", true);
    const collection = await collectionRef.get();
    collection.forEach(async (doc) => {
      const bannerRef = firestore.doc(`banners/${doc.data().id}`);
      await bannerRef.update({
        secondBanner: false,
      });
    });
  }
  try {
    delete productObj.file;
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteBanner = async (id) => {
  const productRef = firestore.doc(`banners/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const getAllCampaigns = async () => {
  const productsCollectionRef = firestore.collection("campaigns");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadCampaign = async (productObj) => {
  const productRef = firestore.doc(`campaigns/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj, file: "" };
  if (productObj.secondBanner) {
    const collectionRef = firestore
      .collection(`campaigns`)
      .where("secondBanner", "==", true);
    const collection = await collectionRef.get();
    collection.forEach(async (doc) => {
      const bannerRef = firestore.doc(`campaigns/${doc.data().id}`);
      await bannerRef.update({
        secondBanner: false,
      });
    });
  }
  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...newProductObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a category with similar id");
  }
};

export const updateCampaign = async (productObj) => {
  const productRef = firestore.doc(`campaigns/${productObj.id}`);
  const product = await productRef.get();
  if (productObj.secondBanner) {
    const collectionRef = firestore
      .collection(`campaigns`)
      .where("secondBanner", "==", true);
    const collection = await collectionRef.get();
    collection.forEach(async (doc) => {
      const bannerRef = firestore.doc(`campaigns/${doc.data().id}`);
      await bannerRef.update({
        secondBanner: false,
      });
    });
  }
  try {
    delete productObj.file;
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteCampaign = async (id) => {
  const productRef = firestore.doc(`campaigns/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};
export const getAllHomeCategory = async () => {
  const productsCollectionRef = firestore.collection("homeCategories");

  try {
    const products = await productsCollectionRef.get();
    const productsArray = [];
    products.forEach((doc) => {
      productsArray.push(doc.data());
    });
    return productsArray;
  } catch (error) {
    alert(error);
  }
};

export const uploadHomeCategory = async (productObj) => {
  const productRef = firestore.doc(`homeCategories/${productObj.id}`);
  const snapShot = await productRef.get();
  const newProductObj = { ...productObj, file: "" };

  if (!snapShot.exists) {
    try {
      await productRef.set({
        ...newProductObj,
      });
      const updatedSnapShot = await productRef.get();
      return updatedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert("there is already a category with similar id");
  }
};

export const updateHomeCategory = async (productObj) => {
  const productRef = firestore.doc(`homeCategories/${productObj.id}`);
  const product = await productRef.get();

  try {
    delete productObj.file;
    await productRef.update({ ...productObj });
    const updatedSnapShot = await productRef.get();
    return updatedSnapShot.data();
  } catch (error) {
    alert(error);
  }
};

export const deleteHomeCategory = async (id) => {
  const productRef = firestore.doc(`homeCategories/${id}`);
  try {
    await productRef.delete();
  } catch (error) {
    alert(error);
  }
};

export const setShipForMe = async (bookingObj) => {
  const bookingRef = firestore.doc(`shipForMe/${bookingObj.bookingId}`);
  delete bookingObj.file;
  const snapShot = await bookingRef.get();
  if (!snapShot.exists) {
    try {
      await bookingRef.set({
        ...bookingObj,
      });
      console.log(snapShot.data());
      const uploadedSnapShot = await bookingRef.get();
      return uploadedSnapShot.data();
    } catch (error) {
      alert(error);
    }
  } else {
    alert(
      "there is already a booking with similar uid, please try again later",
    );
  }
};

export const getSingleShipForMe = async (bookingId) => {
  try {
    const shipForMeRef = firestore.doc(`shipForMe/${bookingId}`);
    try {
      const shipForMe = await shipForMeRef.get();

      return shipForMe.data();
    } catch (error) {
      alert(error);
    }
  } catch (error) {
    alert(error);
  }
};
export const getSinglePayment1688 = async (paymentId) => {
  try {
    const shipForMeRef = firestore.doc(`paymentLinks1688/${paymentId}`);
    try {
      const shipForMe = await shipForMeRef.get();

      return shipForMe.data();
    } catch (error) {
      alert(error);
      return null;
    }
  } catch (error) {
    alert(error);
    return null;
  }
};

// --- Auth session helpers -------------------------------------------------

// "Keep me signed in" — LOCAL survives a browser restart, SESSION ends with the tab.
/* Always LOCAL. SESSION persistence is scoped to the single tab that signed
   in, and half the panel opens work in a new one - every Invoice link is
   target="_blank". Those tabs booted with no session at all, so
   onAuthStateChanged fired with null, currentAdmin was never set and the
   sidebar menu stayed empty. LOCAL survives new tabs and restarts; the
   "remember" checkbox now only decides whether the email is pre-filled. */
export const setAuthPersistence = () =>
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export const sendPasswordReset = (email) => auth.sendPasswordResetEmail(email);

// --- 1688 category rates --------------------------------------------------
//
// Every category (root, sub, sub-sub) is one document in `1688Category`,
// carrying `ancestors` — the ordered list of category ids above it.
//
// A category is priced in one of two ways:
//   own       an admin set a price on this category directly (`ownAirRates` /
//             `ownSeaRates`), and nothing above it can overwrite that.
//   inherited it has no price of its own, so it uses the nearest ancestor that
//             does. The resolved rates are written into the flat parcel/ten/
//             eleven/... fields as well, so the customer app keeps reading the
//             same fields it always has.

// Air rates carry a China price and a Hong Kong price per tier — the `_hk`
// fields are the same tiers, priced for shipments out of Hong Kong instead.
export const AIR_RATE_FIELDS = [
  "parcel",
  "ten",
  "eleven",
  "above_100kg",
  "parcel_hk",
  "ten_hk",
  "eleven_hk",
  "above_100kg_hk",
];
// Sea rates now carry the same China / Hong Kong split as air.
export const SEA_RATE_FIELDS = [
  "100kg",
  "below_1000kg",
  "above_1000kg",
  "100kg_hk",
  "below_1000kg_hk",
  "above_1000kg_hk",
];

const rateKeysFor = (freightType) =>
  freightType === "sea"
    ? {
        fields: SEA_RATE_FIELDS,
        own: "ownSeaRates",
        source: "seaRateSource",
        from: "seaInheritedFrom",
      }
    : {
        fields: AIR_RATE_FIELDS,
        own: "ownAirRates",
        source: "airRateSource",
        from: "airInheritedFrom",
      };

export const getAll1688Categories = async () => {
  const snapShot = await firestore.collection("1688Category").get();
  const categories = [];
  snapShot.forEach((doc) => categories.push({ ...doc.data(), docId: doc.id }));
  return categories;
};

// The nearest ancestor holding its own price, walking upwards from `node`.
const nearestPricedAncestor = (ancestors, ownById) => {
  for (let i = (ancestors || []).length - 1; i >= 0; i--) {
    if (ownById[String(ancestors[i])]) return ancestors[i];
  }
  return null;
};

/**
 * Gives `categoryId` its own price and pushes it down the subtree.
 *
 * A descendant is only rewritten when this category is its NEAREST priced
 * ancestor — anything that has its own price keeps it, and so does everything
 * underneath it. Returns { updated, kept } so the caller can report what moved.
 */
export const set1688CategoryRates = async (categoryId, freightType, rates) => {
  const keys = rateKeysFor(freightType);
  const id = String(categoryId);

  const cleaned = {};
  keys.fields.forEach((field) => {
    cleaned[field] = String(
      rates[field] === undefined ? "" : rates[field],
    ).trim();
  });

  const targetUpdate = {
    [keys.own]: cleaned,
    [keys.source]: "own",
    [keys.from]: null,
    ...cleaned,
  };
  await firestore.doc(`1688Category/${id}`).update(targetUpdate);

  const descendants = await firestore
    .collection("1688Category")
    .where("ancestors", "array-contains", Number(categoryId))
    .get();

  // Own-price map for the subtree, so "nearest priced ancestor" is answerable
  // without extra reads.
  const ownById = { [id]: cleaned };
  descendants.forEach((doc) => {
    const data = doc.data();
    if (data[keys.own]) ownById[doc.id] = data[keys.own];
  });

  const toUpdate = [];
  let kept = 0;

  descendants.forEach((doc) => {
    const data = doc.data();
    if (data[keys.own]) {
      kept += 1;
      return;
    }
    const from = nearestPricedAncestor(data.ancestors, ownById);
    // A nearer priced ancestor inside the subtree owns this one.
    if (String(from) !== id) {
      kept += 1;
      return;
    }
    toUpdate.push(doc.ref);
  });

  for (let i = 0; i < toUpdate.length; i += 400) {
    const batch = firestore.batch();
    toUpdate.slice(i, i + 400).forEach((ref) => {
      batch.update(ref, {
        [keys.source]: "inherited",
        [keys.from]: Number(categoryId),
        ...cleaned,
      });
    });
    await batch.commit();
  }

  return {
    updated: toUpdate.length,
    kept,
    updatedIds: toUpdate.map((ref) => ref.id),
    rates: cleaned,
    keys,
  };
};

/**
 * Drops a category's own price so it falls back to inheriting again. The
 * category and everything under it that was following it are re-resolved
 * against the nearest priced ancestor further up.
 */
export const clear1688CategoryRates = async (categoryId, freightType) => {
  const keys = rateKeysFor(freightType);
  const id = String(categoryId);

  const targetSnap = await firestore.doc(`1688Category/${id}`).get();
  if (!targetSnap.exists) {
    return { updated: 0, inheritedFrom: null, updatedIds: [], rates: {}, keys };
  }
  const target = targetSnap.data();

  // Find what this category will inherit from now, by reading its ancestors.
  const ancestors = target.ancestors || [];
  let source = null;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const snap = await firestore.doc(`1688Category/${ancestors[i]}`).get();
    if (snap.exists && snap.data()[keys.own]) {
      source = { id: Number(ancestors[i]), rates: snap.data()[keys.own] };
      break;
    }
  }

  const resolved = {};
  keys.fields.forEach((field) => {
    resolved[field] = source ? String(source.rates[field] || "") : "";
  });

  await firestore.doc(`1688Category/${id}`).update({
    [keys.own]: firebase.firestore.FieldValue.delete(),
    [keys.source]: source ? "inherited" : "none",
    [keys.from]: source ? source.id : null,
    ...resolved,
  });

  const descendants = await firestore
    .collection("1688Category")
    .where("ancestors", "array-contains", Number(categoryId))
    .get();

  const ownById = {};
  descendants.forEach((doc) => {
    const data = doc.data();
    if (data[keys.own]) ownById[doc.id] = data[keys.own];
  });

  const toUpdate = [];
  descendants.forEach((doc) => {
    const data = doc.data();
    if (data[keys.own]) return;
    // Only the ones that were following this category move with it.
    if (nearestPricedAncestor(data.ancestors, ownById) !== null) return;
    toUpdate.push(doc.ref);
  });

  for (let i = 0; i < toUpdate.length; i += 400) {
    const batch = firestore.batch();
    toUpdate.slice(i, i + 400).forEach((ref) => {
      batch.update(ref, {
        [keys.source]: source ? "inherited" : "none",
        [keys.from]: source ? source.id : null,
        ...resolved,
      });
    });
    await batch.commit();
  }

  return {
    updated: toUpdate.length,
    inheritedFrom: source ? source.id : null,
    updatedIds: toUpdate.map((ref) => ref.id),
    rates: resolved,
    source: source ? "inherited" : "none",
    keys,
  };
};
