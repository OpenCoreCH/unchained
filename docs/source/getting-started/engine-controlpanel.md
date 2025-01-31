---
title: Add new products to your store
sidebar_title: Add products
---

<style>
  .warning {
    color: red;
    font-size: 1rem;
    padding: 1rem;
    border: 1px solid red;
  }

  .info {
    color: #1f5cb4;
    font-weight: bold;
    font-size: 1rem;
    padding: 1rem;
    border: 1px solid #1f5cb4;
  }

  code: {
    color: black;
  }
  .normal {
    color: black;
  }
</style>

> This chapter teaches you how to add new products and categories to your store. It explains the major entities like categories, pricing & products required to show some products in the storefront app.

![diagram](../images/getting-started/Engine_Setup.png)

This tutorial helps you to ...

- Log into your Admin UI
- Fill your store with content using the Admin UI
- Understand the store's data entities
- Use graphQL queries and mutations to feed and search over the Unchained Engine api.

<p class="info">This is an example application of a management admin UI.<br />The Unchained Engine is designed for professional enterprise applications and uses powerful plugins to connect to existing CRM solutions which should be the choice if you build the store.<br />However, to start we can manage a simple shop catalogue and add a basic payment option using the provide Admin UI.</p>

## Step 1: Access Admin UI

In order to add content to your store, you need to log into the store's admin UI.
Navigate to the login window of your admin UI

Initially the username and password are set as following:

**Username**: _admin@unchained.local_<br />
**Password**: _password_

![diagram](../images/getting-started/Control_Panel_Start_View.png)

<p class="warning">This is a test project using common hard-coded credentials. Change your password as soon as you intend to work professionally with the engine. (<b class="normal"><code class="language-text">User Profile</code> ➤ <code class="language-text">Account</code></b>)</p>

## Step 1: Add Payment Provider

One of the basic settings besides the **currency** & **language** is the **payment provider** for your store. We gonna add a simple _Pay per invoice_ method to our shop.<br />
Check [Further Reading](#further-reading) at the end of this chapter for a (growing) list of payment plugins available for the Unchained Engine.

- On top choose the menu entry **`System` ➤ `Payment`**
  ![diagramm](../images/getting-started/Control_Panel_System_Payment.png)
- Click on **`Add`** in the empty list view.
- Select type **`Invoice`**, choose the adapter **`Invoice (manually)`** and click on **`Add new adapter`** to save invoice payment provider.
  ![diagramm](../images/getting-started/Control_Panel_Payment_Invoice.png)
- Click **`Save`** in the next screen as we do not need to add any additional configuration keys in this example project.
- The new payment provider **INVOICE** should appear in the list.
  ![diagramm](../images/getting-started/Control_Panel_Payment_List.png)

## Step 2: Set Delivery Option

The second important configuration is **delivery option** which defines where and how orders should be send to for furhter processing.<br />

- On top choose the menu entry **`System` ➤ `Delivery`**
- Click on **`Add`** in the empty list view.
- Select type **`Shipping`**, choose the adapter **`Forward Delivery via Messaging`** and click on **`Add Delivery provider`** to continue.
  ![diagramm](../images/getting-started/Control_Panel_Delivery_Shipping.png)
- In the configuration window set email addresses (can be non-existing phantom addresses) for the keys **from** and **to**, delete the **cc** key and click **`Save`**.
- The new delivery provider **SHIPPING** should appear in the list. (You might need to select the delivery list again in the top menu)
  ![diagramm](../images/getting-started/Control_Panel_Delivery_List.png)

## Step 3: Add Product

It's time to add our first product to the store.

- On top choose the menu entry **`Master Data` ➤ `Products`**
- Click on **`Add`** in the empty product list.
- Give the product a **name** and set the **type** to `Simple Product`.
  ![diagramm](../images/getting-started/Control_Panel_Product_Toothbrush_Add.png)
- Click **`Add product`** to save the product and navigate to the product detail view.
- (If you have one ready, add a nice product image under `Media`.)
- Select **`Commerce`** on the left and set the price for your product.
- IMPORTANT: If you want to update the product information (e.g. subtitle, description), switch to the tab `fr` first and set a title there (otherwise updating the product throws an error (yes, it's a bug 😒).
- Per default a product is in the state **draft**. To make it available in the shop we need to **`publish`** it.<br />On the right you find the option to publish (and unpublish) to product.
  ![diagramm](../images/getting-started/Control_Panel_Product_Matchbox_Publish.png)
- Great! The product is ready to be assigned to a category.
- Do it again and add a second product!

## Step 4: Create Category (Assortment) with Products

Firstly, we will add two new categories which are called _Assortments_ in the Admin UI.

- On top choose the menu entry **`Master Data` ➤ `Assortments`**.
- Click on **`Add`**.
- Give your category a **title**, keep the _root node_ option checked.
- Click **`Add Assortment`** to save the category and navigate to the category detail view.
- (Same here, add a nice category image under `Media`.)
  ![diagram](../images/getting-started/Control_Panel_Assortment_Camping_Details.png)
- Select **`Products`** on the left.
- Search for the **(exact)** name of the product you added in [Step 3](#step-3-add-product), select it
  and click **`Add Product`** to link the product to the category

## Step 5. Admire the Products

Open your local storefront app http://localhost:3000 and verify that the categories appear on the entry page.
Choose a category to see the underlying products and start shopping! 😎

![diagram](../images/getting-started/Storefront_Startscreen.png)

## Step 6: Place an Order
Now, you are able to go through a complete check-out and buy a product with the pay-per-invoice payment method.

On successful completion of an order you will find a new entry in the **Orders** list and a detailed order view including the the **Invoice Paid** option.

## Further Reading

Those are only the basic steps to fill some products into your store and process an order.

Check out further guides in the list below and do not hesitate to contact us if you need help 🍫!

- [Plugins](../plugins/plugin-overview)
- [API](https://docs.unchained.shop/api)
