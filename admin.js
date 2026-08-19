import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  initializeAppCheck,
  ReCaptchaV3Provider
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js";

import {
  firebaseConfig,
  storeSettings
} from "./firebase-config.js";


/* =========================
   BASIC SETUP
========================= */

const configured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("PASTE");

const $ = (selector) => document.querySelector(selector);

let auth;
let db;
let products = [];

let loginAttempts = 0;
let lockUntil = 0;


/* =========================
   HELPERS
========================= */

const el = (tag, cls, text) => {
  const node = document.createElement(tag);

  if (cls) {
    node.className = cls;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};


function safeUrl(url) {
  if (!url) {
    return "assets/placeholder.svg";
  }

  try {
    // السماح بصور موجودة داخل مجلد assets
    if (
      url.startsWith("assets/") ||
      url.startsWith("./assets/")
    ) {
      return url;
    }

    const parsed = new URL(url, location.href);

    if (
      parsed.protocol === "https:" ||
      parsed.origin === location.origin
    ) {
      return parsed.href;
    }

    return "assets/placeholder.svg";

  } catch {
    return "assets/placeholder.svg";
  }
}


function validateImageUrl(url) {
  if (!url) {
    return "";
  }

  const value = url.trim();

  // صورة موجودة داخل ملفات الموقع
  if (
    value.startsWith("assets/") ||
    value.startsWith("./assets/")
  ) {
    return value;
  }

  try {
    const parsed = new URL(value);

    // HTTPS فقط للأمان
    if (parsed.protocol !== "https:") {
      return "";
    }

    return parsed.href;

  } catch {
    return "";
  }
}


function showStatus(target, text, type = "") {
  const node = $(target);

  if (!node) {
    return;
  }

  node.textContent = text;
  node.className = `status ${type}`.trim();
}


/* =========================
   FIREBASE INITIALIZATION
========================= */

if (configured) {

  const app = initializeApp(firebaseConfig);

  if (storeSettings.appCheckSiteKey) {

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        storeSettings.appCheckSiteKey
      ),
      isTokenAutoRefreshEnabled: true
    });

  }

  auth = getAuth(app);
  db = getFirestore(app);

  setPersistence(
    auth,
    browserSessionPersistence
  ).catch(() => {});

} else {

  showStatus(
    "#loginStatus",
    "أضف بيانات Firebase داخل firebase-config.js أولاً.",
    "error"
  );

}


/* =========================
   ADMIN PERMISSION
========================= */

async function isAdmin(uid) {

  if (!uid || !db) {
    return false;
  }

  const snap = await getDoc(
    doc(db, "users", uid)
  );

  return (
    snap.exists() &&
    snap.data().role === "admin"
  );
}


/* =========================
   LOGIN
========================= */

async function login(e) {

  e.preventDefault();

  if (!configured) {
    return;
  }

  if (Date.now() < lockUntil) {

    showStatus(
      "#loginStatus",
      "محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.",
      "error"
    );

    return;
  }

  const email =
    $("#email")?.value.trim() || "";

  const password =
    $("#password")?.value || "";

  if (!email || !password) {

    showStatus(
      "#loginStatus",
      "اكتب البريد الإلكتروني وكلمة المرور.",
      "error"
    );

    return;
  }

  try {

    showStatus(
      "#loginStatus",
      "جاري تسجيل الدخول..."
    );

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginAttempts = 0;

  } catch {

    loginAttempts++;

    if (loginAttempts >= 5) {

      lockUntil =
        Date.now() + 60 * 1000;

      loginAttempts = 0;
    }

    showStatus(
      "#loginStatus",
      "تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.",
      "error"
    );

  }
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  try {

    const snap = await getDocs(
      query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      )
    );

    products = snap.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    renderList();

  } catch (error) {

    console.error(error);

    showStatus(
      "#formStatus",
      "تعذر تحميل المنتجات.",
      "error"
    );

  }
}


/* =========================
   RENDER PRODUCT LIST
========================= */

function renderList() {

  const wrap = $("#adminProducts");

  if (!wrap) {
    return;
  }

  const search =
    $("#adminSearch")?.value
      .trim()
      .toLowerCase() || "";

  wrap.replaceChildren();

  const list = products.filter((product) => {

    const text = `
      ${product.nameAr || ""}
      ${product.nameEn || ""}
      ${product.sku || ""}
      ${product.karat || ""}
    `.toLowerCase();

    return text.includes(search);
  });


  if (!list.length) {

    wrap.append(
      el(
        "div",
        "empty-state",
        "لا توجد منتجات مطابقة."
      )
    );

    return;
  }


  for (const product of list) {

    const row =
      el("div", "admin-product");

    const img =
      document.createElement("img");

    img.src =
      safeUrl(
        product.image ||
        "assets/placeholder.svg"
      );

    img.alt =
      product.nameAr ||
      product.nameEn ||
      "Product";

    img.loading = "lazy";

    img.onerror = () => {
      img.src = "assets/placeholder.svg";
    };


    const body =
      el("div", "");

    body.append(
      el(
        "h4",
        "",
        product.nameAr ||
        product.nameEn ||
        "بدون اسم"
      )
    );


    body.append(
      el(
        "small",
        "",
        `${Number(product.price || 0).toLocaleString()} EGP
         · ${Number(product.weight || 0).toLocaleString()} g
         · عيار ${product.karat || "925"}
         · مخزون ${Number(product.stock || 0)}
         · ${product.active === false ? "مخفي" : "ظاهر"}
         ${product.sku ? " · " + product.sku : ""}`
      )
    );


    const actions =
      el("div", "admin-actions");


    const edit =
      el(
        "button",
        "small-btn",
        "تعديل"
      );

    edit.type = "button";

    edit.onclick = () =>
      editProduct(product.id);


    const del =
      el(
        "button",
        "small-btn danger",
        "حذف"
      );

    del.type = "button";

    del.onclick = () =>
      removeProduct(product.id);


    actions.append(
      edit,
      del
    );

    row.append(
      img,
      body,
      actions
    );

    wrap.append(row);
  }
}


/* =========================
   EDIT PRODUCT
========================= */

function editProduct(id) {

  const product =
    products.find(
      (item) => item.id === id
    );

  if (!product) {
    return;
  }

  $("#productId").value = id;

  const fields = [
    "nameAr",
    "nameEn",
    "descAr",
    "descEn",
    "price",
    "oldPrice",
    "stock",
    "sku",
    "material",
    "weight",
    "karat"
  ];


  for (const key of fields) {

    const input =
      $("#" + key);

    if (input) {
      input.value =
        product[key] ?? "";
    }

  }


  const imageUrl =
    $("#imageUrl");

  if (imageUrl) {
    imageUrl.value =
      product.image || "";
  }


  $("#sizes").value =
    Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "";


  $("#category").value =
    product.category ||
    "rings";


  for (const key of [
    "featured",
    "isNew",
    "onSale",
    "active"
  ]) {

    const input =
      $("#" + key);

    if (input) {
      input.checked =
        !!product[key];
    }
  }


  $("#formTitle").textContent =
    "تعديل المنتج";

  $("#cancelEdit")
    .classList
    .add("show");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   RESET FORM
========================= */

function resetForm() {

  $("#productForm").reset();

  $("#productId").value = "";

  $("#stock").value = "1";
  $("#weight").value = "0";

  $("#material").value =
    "Sterling Silver";

  $("#karat").value =
    "925";

  $("#active").checked =
    true;

  $("#formTitle").textContent =
    "إضافة منتج";

  $("#cancelEdit")
    .classList
    .remove("show");


  const imageFile =
    $("#imageFile");

  if (imageFile) {
    imageFile.value = "";
  }
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct(e) {

  e.preventDefault();

  try {

    const id =
      $("#productId").value;


    /* =========================
       IMAGE
    ========================= */

    const imageField =
      $("#imageUrl");

    let image =
      validateImageUrl(
        imageField?.value || ""
      );


    const oldProduct =
      id
        ? products.find(
            (item) => item.id === id
          )
        : null;


    if (
      !image &&
      oldProduct?.image
    ) {
      image =
        oldProduct.image;
    }


    /*
      Firebase Storage غير مستخدم.

      لو المستخدم اختار ملف صورة من الجهاز،
      نمنع الحفظ ونطلب رابط الصورة بدلًا منه.
    */

    const fileInput =
      $("#imageFile");

    const file =
      fileInput?.files?.[0];


    if (file) {

      throw new Error(
        "رفع الصور مباشرة من الجهاز غير مفعّل حالياً. استخدم رابط HTTPS للصورة في خانة رابط الصورة."
      );

    }


    if (!image) {

      image =
        "assets/placeholder.svg";

    }


    /* =========================
       PRODUCT DATA
    ========================= */

    const sizes =
      $("#sizes")
        .value
        .split(",")
        .map(
          (value) =>
            value.trim()
        )
        .filter(Boolean)
        .slice(0, 30);


    const price =
      Number(
        $("#price").value || 0
      );


    const oldPrice =
      Number(
        $("#oldPrice").value || 0
      );


    const stock =
      Math.floor(
        Number(
          $("#stock").value || 0
        )
      );


    const weight =
      Number(
        $("#weight").value || 0
      );


    const data = {

      nameAr:
        $("#nameAr").value.trim(),

      nameEn:
        $("#nameEn").value.trim(),

      descAr:
        $("#descAr").value.trim(),

      descEn:
        $("#descEn").value.trim(),

      price,

      oldPrice,

      category:
        $("#category").value,

      image,

      featured:
        $("#featured").checked,

      isNew:
        $("#isNew").checked,

      onSale:
        $("#onSale").checked,

      active:
        $("#active").checked,

      stock,

      sku:
        $("#sku").value.trim(),

      material:
        $("#material").value.trim(),

      karat:
        $("#karat").value.trim(),

      sizes,

      weight,

      updatedAt:
        serverTimestamp()

    };


    /* =========================
       VALIDATION
    ========================= */

    if (
      !data.nameAr ||
      !data.nameEn
    ) {

      throw new Error(
        "اسم المنتج مطلوب بالعربي والإنجليزي."
      );

    }


    if (
      !Number.isFinite(data.price) ||
      data.price < 0
    ) {

      throw new Error(
        "السعر غير صالح."
      );

    }


    if (
      !Number.isFinite(data.weight) ||
      data.weight < 0
    ) {

      throw new Error(
        "الوزن غير صالح."
      );

    }


    if (
      !Number.isInteger(data.stock) ||
      data.stock < 0
    ) {

      throw new Error(
        "المخزون غير صالح."
      );

    }


    if (
      !/^[0-9A-Za-z .-]{1,20}$/.test(
        data.karat
      )
    ) {

      throw new Error(
        "العيار غير صالح. مثال: 925"
      );

    }


    if (
      data.oldPrice > 0 &&
      data.oldPrice < data.price
    ) {

      throw new Error(
        "السعر قبل الخصم يجب ألا يكون أقل من السعر الحالي."
      );

    }


    /* =========================
       FIRESTORE SAVE
    ========================= */

    if (id) {

      await updateDoc(
        doc(
          db,
          "products",
          id
        ),
        data
      );

    } else {

      await addDoc(
        collection(
          db,
          "products"
        ),
        {
          ...data,
          createdAt:
            serverTimestamp()
        }
      );

    }


    showStatus(
      "#formStatus",
      "تم حفظ المنتج بنجاح.",
      "success"
    );


    resetForm();

    await loadProducts();


  } catch (error) {

    console.error(error);

    showStatus(
      "#formStatus",
      `خطأ: ${error.message}`,
      "error"
    );

  }
}


/* =========================
   DELETE PRODUCT
========================= */

async function removeProduct(id) {

  const product =
    products.find(
      (item) => item.id === id
    );


  const confirmed =
    confirm(
      `متأكد من حذف ${
        product?.nameAr ||
        "المنتج"
      }؟`
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );

    await loadProducts();

  } catch (error) {

    console.error(error);

    alert(
      "تعذر حذف المنتج: " +
      error.message
    );

  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  if (auth) {
    await signOut(auth);
  }

}


/* =========================
   EVENTS
========================= */

$("#loginForm").onsubmit =
  login;

$("#productForm").onsubmit =
  saveProduct;

$("#cancelEdit").onclick =
  resetForm;

$("#openStore").onclick =
  () => {
    location.href =
      "index.html";
  };

$("#logoutBtn").onclick =
  logout;

$("#logoutMobile").onclick =
  logout;

$("#adminSearch").oninput =
  renderList;


/* =========================
   AUTH STATE
========================= */

if (configured) {

  onAuthStateChanged(
    auth,
    async (user) => {

      try {

        if (
          user &&
          await isAdmin(user.uid)
        ) {

          $("#loginView")
            .classList
            .add("admin-hidden");

          $("#adminView")
            .classList
            .remove("admin-hidden");

          await loadProducts();

        } else {

          $("#adminView")
            .classList
            .add("admin-hidden");

          $("#loginView")
            .classList
            .remove("admin-hidden");


          if (user) {

            showStatus(
              "#loginStatus",
              "هذا الحساب غير مصرح له بدخول لوحة الإدارة.",
              "error"
            );

            await signOut(auth);
          }

        }

      } catch (error) {

        console.error(error);

        showStatus(
          "#loginStatus",
          "تعذر التحقق من صلاحية الحساب.",
          "error"
        );

        if (user) {
          await signOut(auth);
        }

      }

    }
  );

}
