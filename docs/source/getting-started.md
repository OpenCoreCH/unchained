---
title: Get started with Unchained Engine
sidebar_title: Create a Project
---

> This tutorial walks you through installing and configuring Unchained Engine.
> If you're just getting started with GraphQL or Node.js this will be too hard to follow

This tutorial helps you:

- Obtain a basic understanding of the architecture
- Bootstrap a basic unchained backed project
- Write a pricing plugin
- Deploy an unchained engine backed project

This tutorial assumes that you are familiar with the command line and
JavaScript, and that you have a recent version of Meteor.js installed.

## Step 1: Create a new project

1.  Initialize a new Unchained project with `npm` (or another package manager you
    prefer, such as Yarn):

```bash
npm init unchained
```

Your project directory now contains the following folders:

- x
- y
- z

## Step 2: Write a custom pricing plugin

```js
import {
  ProductPricingDirector,
  ProductPricingAdapter
} from "meteor/unchained:core-pricing";
import fetch from "isomorphic-unfetch";

const PRODUCT_TAG_SAUSAGE = "sausage";
const SAUSAGE_THRESHOLD_CELSIUS = 20;

class WeatherDependentBarbequeSausagePricing extends ProductPricingAdapter {
  static key = "shop.unchained.wd-bbq-sausage-pricing";
  static version = "1.0";
  static label = "Calculate the price of a sausage 🌭🌦";
  static orderIndex = 3;

  static isActivatedFor(product) {
    if (
      product.tags &&
      product.tags.length > 0 &&
      product.tags.indexOf(PRODUCT_TAG_SAUSAGE) !== -1
    ) {
      return true;
    }
    return false;
  }

  async calculate() {
    const { currency, quantity } = this.context;
    try {
      const response = await fetch(
        "https://query.yahooapis.com/v1/public/yql?q=select%20item.condition.temp%20from%20weather.forecast%20where%20woeid%20%3D%20784794&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
      );
      if (response.status === 200) {
        const { query } = await response.json();
        const { results, count } = query;
        if (count > 0) {
          const { temp: tempFahrenheit } = results.channel.item.condition;
          const tempCelsius = (parseFloat(tempFahrenheit) - 32) / 1.8;
          if (tempCelsius > SAUSAGE_THRESHOLD_CELSIUS) {
            console.log("🌭 -> High season, sausage pricy!!"); // eslint-disable-line
            this.result.addItem({
              currency,
              amount: +100 * quantity,
              isTaxable: true,
              isNetPrice: true,
              meta: { adapter: this.constructor.key }
            });
          }
        }
      }
    } catch (e) {
      console.error("🌭 -> Failed while trying to price weather dependent"); // eslint-disable-line
    }

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(WeatherDependentBarbequeSausagePricing);
```

## Step 3: Deploy the stack with docker

```bash
docker stack deploy -c docker-compose.yml my-project
```

## Next steps

blabla:

- [Schema basics](/schema/schema/)
- [Resolvers](/data/resolvers/)
- [Deploying with Heroku](/deployment/heroku/)
