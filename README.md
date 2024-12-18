# SAP BTP Event-Driven Multi-Tenant Architecture with CAP and SAP Event Mesh
[![License: Apache2](https://img.shields.io/badge/License-Apache2-green.svg)](https://opensource.org/licenses/Apache-2.0)

## Description
This sample code aims to help SAP developers (customers or partners) to develop **event-driven applications** on **SAP Business Technology Platform** using **SAP Event Mesh** as the event message broker with a **SaaS Multi-Tenant** approach. The code is developed using the **SAP Cloud Application Programming Model (CAP) NodeJS framework** leveraging its out-of-the-box messaging capabilities and implements two **microservices**: the first **consumes event messages** from a **message queue** in an SAP Event Mesh **message client** and **dispatches** them to the second, which is a **multi-tenant application** that **receives** such messages in the **subscriber** according to the **message source**.
> **IMPORTANT NOTE**: please be aware that the code in this repository is targeted to experienced CAP developers and is provided as is, serving exclusively as a reference for further developments.

## Solution Architecture
![Event-Driven Multi-Tenant Architecture](https://i.imgur.com/30tVyks.png "Event-Driven Multi-Tenant Architecture")

## Requirements
- One SAP Business Technology Platform **subaccount** (**cannot be trial** as there's no SAP Event Mesh with plan "default" on such landscape) with **Cloud Foundry** environment enabled - this is the **provider subaccount**
- One or more SAP Business Technology Platform **subaccounts** (no **Cloud Foundry** enablement required) - these are the **consumer/subscriber subaccounts**
- SAP Business Application Studio entitlement / subscription (**Full Stack Cloud Application Dev Space** in the **provider subaccount**)
- SAP HANA Cloud entitlement (any subaccount) 
- SAP Event Mesh with plan "default" entitlement in the **provider subaccount**
- SAP Event Mesh with plan "standard (Application)" entitlement in the **provider subaccount**

## Prerequisites
- Subscribe to SAP Business Application Studio in the **provider subaccount** and create a **Full Stack Cloud Application Dev Space**
- Create a SAP HANA Cloud database instance with plan "hana-cloud" or share an existing one with the **provider subaccount**
- Subscribe to SAP Event Mesh "standard (Application)" plan in the **provider subaccount**
- Assign the following role collections to your user: **Enterprise Messaging Administrator**, **Enterprise Messaging Developer**, **Enterprise Messaging Display**, **Enterprise Messaging Subscription Administrator**
- Create a service instance of SAP Event Mesh "default" plan in the **provider subaccount** named **s4-client1** using the parameters from the **event-dispatcher/message-client-params.json** file provided in this repo
- Create a service key named **s4-client1-key** for that service instance
- Using the **SAP Event Mesh application** subscription, access the **s4-client01** message client and create a queue (with default parameters) named **s4-client01-queue**
- Subscribe that queue to the following topics: **s4/msg/client01/ce/sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1** and **s4/msg/client01/ce/sap/s4/beh/businesspartner/v1/BusinessPartner/Changed/v1**
- Configure one or more S4/HANA Cloud tenants to publish the above topics to the **s4-client01** message client (use the **s4-client1-key** you created for the service instance). To perform that setup follow the instructions from these two links: [Creating Communication Arrangements](https://help.sap.com/docs/btp/sap-business-technology-platform/creating-communication-arrangements-705564ad01504a9280ba69bbe99a91ba) and [Maintain Outbound Event Topics](https://help.sap.com/docs/btp/sap-business-technology-platform/maintain-outbound-event-topics)

## Download and Installation

### Clone the Project Repo
1. Access your **SAP Business Application Studio** full-stack cloud development **Dev Space**
2. Open a new terminal (if not yet opened): **Terminal** > **New Terminal**
3. From the default **projects** folder, create the project directory:
> **NOTE**: if you have not set the **projects** folder to become your **current workspace** in BAS your terminal might end-up in the **user** folder. So, do `cd projects` before executing the command below.   
```
mkdir event-driven-mtx
```
3. Clone this main branch into the recently created directory:
```
git clone https://github.com/SAP-samples/btp-event-driven-multi-tenant-architecture.git event-driven-mtx
```

### Deploy the Multi-Tenant Event Consumer application
1. Login to **Cloud Foundry** in the **provider subaccount**:
```
cd event-driven-mtx/event-consumer-mtx && cf login
```
2. Build the **MTA Archive**:
```
mbt build
```
3. Deploy the **MTA Archive**:
```
cf deploy mta_archives/event-consumer-mtx_1.0.0.mtar
```

### Configure the CF API Destination
1. In the **SAP BTP Cockpit**, on the **left-hand pane** click on **Instances and Subscriptions**
2. In the **Instances** list locate the **event-consumer-mtx-destination-service** service instance and click on it
3. In the new tab that will pop-up, on the **left-hand pane**, click on **Destinations**
4. Locate the **event-consumer-mtx-cfapi** destination and click on **Edit** (small pencil on the right)
5. In the **Token Service URL** change the word "**login**" to "**uaa**"
6. Provide a valid BTP user and password (user must be assigned to the subaccount CF org and space as org user and space developer respectively). **IMPORTANT**: do not take a user from a REAL person for this setup to avoid security issues, instead create a technical user following these specifications.
7. To enable the **Save** button write a single letter (e.g. "a") in the **Client Secret**
8. Click on **Save**
9. Click on **Edit**
10. Clear the **Client Secret**
11. Click on **Save**

### Create the Destination to the Multi-Tenant Event Consumer application
1. In the **SAP BTP Cockpit** go to the **Cloud Foundry space** where you deployed the **Multi-Tenant Event Consumer** app, locate it in the apps list (**event-consumer-mtx-app**) and click on it
2. Make a copy of the URL under **Application Routes** 
3. On the **left-hand pane** click on **Service Bindings**
4. Select the **event-consumer-mtx-auth** service instance
5. Click on **Show sensitive data**
6. Make a copy of **clientid**, **clientsecret** and **url**
7. Back to the **subaccount home page**, on the **left-hand pane** expand **Connectivity** and click on **Destinations** 
8. Click on **Create Destination** 
9. Fill the **form** with the following information:
- Name: **Event-Consumer**
- Type: HTTP
- Description: Consumer Tenant of Provider Event Messages
- URL: use the URL copied from the app **Application Routes**
- Authentication: OAuth2ClientCredentials
- Client ID: use the **clientid** copied from the **service binding** 
- Client Secret: use the **clientsecret** copied from the **service binding**
- Token Service URL: replace the first part of the **url** copied from the **service binding** (text right after "https://" until the first "." - e.g. 'https://**thispart**.') with the word **subDomain** and append the path "**/oauth/token**" to that url. You will end-up with something like this: **https://subDomain.authentication.<subaccount region>.hana.ondemand.com/oauth/token**.
> **NOTE**: it's **extremely important** that the word **subDomain** respects the case determined in this document ("sub" in lower-case, capital "D" and "omain" in lower-case).
10. Click on **Save**

### Deploy the Event Dispatcher service
1. Back to the **Business Application Studio** terminal, build the **MTA Archive**:
```
cd ../event-dispatcher && mbt build
```
2. Deploy the **MTA Archive**:
```
cf deploy mta_archives/event-dispatcher_1.0.0.mtar
```

### Create the Destination to the Event Dispatcher service
1. In the **SAP BTP Cockpit** go to the **Cloud Foundry space** where you deployed the **Event Dispatcher** service, locate it in the apps list (**event-dispatcher-srv**) and click on it
2. Make a copy of the URL under **Application Routes** 
3. On the **left-hand pane** click on **Service Bindings**
4. Select the **event-dispatcher-auth** service instance
5. Click on **Show sensitive data**
6. Make a copy of **clientid**, **clientsecret** and **url**
7. Back to the **subaccount home page**, on the **left-hand pane** expand **Connectivity** and click on **Destinations** 
8. Click on **Create Destination** 
9. Fill the **form** with the following information:
- Name: **Event-Dispatcher**
- Type: HTTP
- Description: Multi-Tenant Event Dispatcher
- URL: use the URL copied from the app **Application Routes**
- Authentication: OAuth2ClientCredentials
- Client ID: use the **clientid** copied from the **service binding** 
- Client Secret: use the **clientsecret** copied from the **service binding**
- Token Service URL: use the **url** copied from the **service binding** appending the path "**/oauth/token**" to it.
10. Click on **Save**

### Test the Solution
> **NOTE**: before testing the solution make sure you have set up **at least one S/4HANA Cloud tenant** to publish **CREATE** and **CHANGE** topics from the **Business Partner BO** to the **message client** as described in the **prerequisites**
1. Create a **subaccount** in the **same region** as the **provider subaccount** where you deployed the solution
2. Access the new subaccount and create a **subscription** of the **Event Messages Consumer (Business Partners)** application
3. When the subscription process is completed click on **Go to Application**
4. In your **S/4HANA Cloud tenant** (configured in the **prerequisites**) create or change a **Business Partner** (use the **Manage Business Partner Master Data** app)
5. Go back to the **application** on BTP and click "**Go**" to refresh the **list report**. You should now see the **Business Partner Code** that has been created or changed in your S/4HANA Cloud tenant along with the **event timestamp**
6. You can now setup **another S/4HANA Cloud tenant** to publish the **same topics** to the **same message client** on BTP and **repeat** steps **1 to 5**. Thus, for each new S/4HANA Cloud tenant publishing those topics to that same message client a new application subscription will capture the messages coming from such tenant and so on...  

## Code Details

You can find a detailed explanation about the mechanics and concepts of this project in [**this blog post**](https://community.sap.com/t5/technology-blogs-by-sap/event-driven-multi-tenant-architecture-on-sap-btp-with-cap-and-sap-event/ba-p/13963064).

## Known Issues
No known issues.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/btp-event-driven-multi-tenant-architecture/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://community.sap.com/t5/technology-q-a/qa-p/technology-questions).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
