import { companyDetails } from "./company-details";

export type LegalPageContent = {
  title: string;
  description: string;
  updated: string;
  links?: { href: string; label: string }[];
  sections: {
    heading: string;
    body: string[];
  }[];
};

export const legalPages: Record<string, LegalPageContent> = {
  privacy: {
    "title": "Privacy Policy",
    "description": "How WRINGG uses information in the Wringg Customer App, Wringg Partner app, website and clothing-care services.",
    "updated": "November 11, 2026",
    "links": [
      {
        "href": "/user-privacy",
        "label": "Manage privacy choices"
      },
      {
        "href": "/delete-account",
        "label": "Request account deletion"
      },
      {
        "href": "mailto:hello@wringg.in?subject=Privacy%20request",
        "label": "Contact us about privacy"
      }
    ],
    "sections": [
      {
        "heading": "Who this notice covers",
        "body": [
          `WRINGG is operated by ${companyDetails.name}. Official address: ${companyDetails.address}.`,
          "WRINGG coordinates clothing-care services in supported Bengaluru neighbourhoods. This notice covers customers, service partners, website visitors and people who contact our support team. Partner verification and payout information is used for partner operations; it is not a requirement for ordinary customer bookings.",
          "For privacy questions, corrections, complaints or deletion requests, email hello@wringg.in or call or WhatsApp +91 84385 08211. Tell us which app or service your request concerns. We may verify account ownership before changing or disclosing account information."
        ]
      },
      {
        "heading": "Account, address and order information",
        "body": [
          "When you sign in or edit your profile, we collect your phone number, account identifier, name and any email or other details you provide. We use your phone number to send a one-time code and use your account details to authenticate you and manage your account. When you book a service, we collect pickup and delivery addresses and their coordinates, contact details, service selections, garment counts, care instructions and order activity to check coverage and arrange pickup, processing and delivery.",
          "Order amounts, cash acknowledgements, receipts, complaints, refunds and settlement records support billing, reconciliation, support and fraud prevention. New cash-at-handover bookings do not require you to give WRINGG a card number. Records of earlier online payments may still be retained.",
          "We collect the order reference, message and other details you submit in a support request, and any rating or feedback you provide. If you contact us by email, phone or WhatsApp, we receive the information you choose to share, including any photos you send. We use this information to respond and resolve issues. Your chosen communication service also handles the interaction under its own privacy notice."
        ]
      },
      {
        "heading": "Location and device permissions",
        "body": [
          "With permission, the customer app uses your current location to help identify your address and check serviceability. Partner location supports onboarding, service areas and matching on-duty partners with nearby work. Saved addresses and relevant work locations can remain associated with accounts and orders.",
          "The apps request foreground location. You can turn off Wringg’s location permission in your device settings at any time and use the address options in the customer app to enter a pickup address. Turning off device location stops that access. Saved addresses and coordinates can still be used for bookings and retained as described below.",
          "Partners use the camera for identity checks and order-proof photos. Verification may also use a selected document image, microphone or liveness capture, depending on the verification flow and platform. These partner permissions do not mean the customer app requires identity documents or camera access."
        ]
      },
      {
        "heading": "Partner identity verification and payouts",
        "body": [
          "Partners provide work and machine details, capabilities, availability, identity information and verification evidence. Didit provides the identity-verification flow and may process identity-document images, facial or liveness information and verification results. WRINGG receives verification information used to review partner eligibility and prevent fraud.",
          "UPI or bank details and payout records are used to arrange and reconcile partner payments. Identity approval, assignment eligibility and payout release are separate operational decisions.",
          "Partner verification documents and related restricted history currently have no automatic expiry. Didit-held copies require separate provider review; closing a WRINGG login does not itself erase those copies."
        ]
      },
      {
        "heading": "Order photos, notifications and technical information",
        "body": [
          "Partners capture pickup and receipt photos as order evidence. Access is restricted to permitted operational users; these photos are not public posts. Avoid including unrelated people, documents or other unnecessary personal information.",
          "Where notifications are configured and permitted, the apps register a device notification token to send order and account updates. You can control notifications in device settings. Tokens, app and device information may be processed by Expo, Google or the relevant platform delivery service.",
          "Hosting, authentication, app-update and other service providers may process connection information, IP addresses, device or app information, and operational or security logs to deliver and protect their services. Device permission controls do not remove records already stored for an order or account."
        ]
      },
      {
        "heading": "Referrals and optional interaction analytics",
        "body": [
          "Referral links can associate a campaign, referral code or installation with an account and later order activity. Referral ownership and business reporting are separate from optional records of how you interact with the app.",
          "In versions where optional interaction analytics are available, collection requires the app's analytics choice. You can withdraw that choice through the controls offered in the app. Optional interaction analytics are not required to book or fulfil an order. Analytics export to an external provider is disabled in the production configuration checked for this notice.",
          "The existing 90-day cleanup job for raw referral visits and interaction events is currently paused, so automatic expiry is not currently assured. Durable referral ownership, installation attribution, order facts and audit records are separate. We do not sell personal information."
        ]
      },
      {
        "heading": "Who receives information",
        "body": [
          "Assigned service partners and authorized staff receive information relevant to their role in pickup, delivery, support, verification or finance. We use Supabase for hosting, authentication and storage, SMS delivery services to send sign-in codes, Expo and platform services for app updates and notifications, Didit for partner verification, and Cloudflare for this website. Payment services, where used, include Razorpay.",
          "When you use a map or address lookup, Google Maps Platform processes the information needed to provide that feature, which can include address or location information, network information and app identifiers.",
          "We require third parties that receive personal data from our apps to provide protection at least equivalent to the safeguards described in this policy and to use the data for the purposes disclosed here. Provider infrastructure may process information outside your location. We may also disclose relevant records when required by applicable law or to address fraud, disputes and safety.",
          "We use access controls and restricted storage to reduce exposure. No online service can guarantee absolute security."
        ]
      },
      {
        "heading": "Account closure and retained records",
        "body": [
          "To request deletion, open Profile in the Wringg Customer App or Wringg Partner app, choose Delete account and confirm Request Deletion. If you cannot access the app, use the account-deletion link above or contact us. Keep the request reference if shown. Active orders, unpaid balances, disputes, refunds or unsettled partner obligations may delay completion. You can check your request status in the customer app or ask support for an update.",
          "Core account cleanup removes or replaces ordinary profile names and contact details, saved address details and coordinates, mutable payout and onboarding details, notification tokens, unused login-session information and specified optional-analytics links. The login is then closed. A non-login account reference remains so historical records stay consistent.",
          "Order and proof records, payment and cash records, earnings and settlement records, audit and state history, fraud-related records and partner verification evidence are outside automatic account cleanup. These categories currently have no fixed automatic expiry. Some records may be needed for transactions, disputes or recordkeeping; we do not claim that indefinite retention of every item is legally required.",
          "Provider-held data, backups and information already exported to another service are not all erased when a WRINGG login closes. Ask support for a separate review of retained records and provider-held copies. We will explain the scope and any applicable restrictions rather than treating login closure as confirmation that every copy has been erased."
        ]
      },
      {
        "heading": "Your choices and privacy requests",
        "body": [
          "You can update available profile details in the app and manage Wringg’s location and notification permissions in your device settings. If your version offers optional interaction analytics, you can withdraw your analytics consent using the app’s analytics control. To request access, correction, deletion or a review of retained information, contact us at hello@wringg.in. Tell us which Wringg app you use and what you would like to request.",
          "Do not send passwords, login or delivery OTPs, bank credentials or identity-document images by email. If a request needs further verification, support should arrange an appropriate method and request only what is necessary.",
          "This notice changes when our data handling changes. The date above identifies the current version."
        ]
      }
    ]
  },
  userPrivacy: {
    title: "Your Privacy Choices",
    description:
      "Manage your privacy settings or request access, correction or deletion of information from the Wringg Customer or Partner app.",
    updated: "November 11, 2026",
    links: [
      {
        href: "mailto:hello@wringg.in?subject=WRINGG%20privacy%20request",
        label: "Email a privacy request",
      },
      { href: "/delete-account", label: "Request account deletion" },
      { href: "/privacy", label: "Read the privacy policy" },
    ],
    sections: [
      {
        heading: "Manage app permissions",
        body: [
          "Use your device settings to change Wringg’s access to location and notifications. In the Customer app, you can enter a pickup address manually when location access is off.",
          "If your app version offers optional interaction analytics, you can withdraw your consent through the app’s analytics control.",
        ],
      },
      {
        heading: "Access or correct your information",
        body: [
          "You can edit available profile details in the app. To request a copy, correction or review of retained information, email hello@wringg.in and tell us which Wringg app you use and what you want us to review.",
          "We may verify account ownership before sharing or changing information. Keep passwords, login or delivery codes, bank credentials and identity-document images out of your email.",
        ],
      },
      {
        heading: "Delete your account",
        body: [
          "Open Profile in the Wringg Customer or Partner app, choose Delete account and confirm Request Deletion. If you cannot access the app, use the Request account deletion link above for instructions on requesting deletion through support.",
          "The Delete Account page explains how to check request status, what can delay deletion, and what information may be retained.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    description: "Simple usage terms for WRINGG customers and local partners.",
    updated: "November 11, 2026",
    sections: [
      {
        heading: "Service usage",
        body: [
          `WRINGG is operated by ${companyDetails.name}. Official address: ${companyDetails.address}.`,
          "WRINGG is operating a hyperlocal clothing-care pilot in selected service zones starting with BTM Layout, Bengaluru.",
          "By booking a service, you agree to provide accurate contact, address, and garment information so pickup, care, and delivery can be coordinated.",
        ],
      },
      {
        heading: "Customer responsibility",
        body: [
          "Please remove valuables, cash, documents, electronics, and delicate items from pockets before handing over clothes.",
          "Customers should point out special care instructions, stains, fabric concerns, or damage before pickup.",
        ],
      },
      {
        heading: "Service limitations",
        body: [
          "Pickup, delivery, partner availability, pricing, and timelines may vary during the pilot and across service zones.",
          "WRINGG may decline or reschedule orders that are outside the active service zone, unsuitable for available care methods, or operationally unavailable.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    description: "How WRINGG handles cancellations, refunds, and order concerns.",
    updated: "May 24, 2026",
    sections: [
      {
        heading: "Cancellations",
        body: [
          "You may request cancellation before pickup confirmation or before the service process begins. Once clothes are collected or processing has started, cancellation may not always be possible.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Refunds are reviewed case by case based on order status, service issue, payment status, and operational records.",
          "Approved refunds may be issued through the original payment method or another mutually agreed method.",
        ],
      },
      {
        heading: "Service concerns",
        body: [
          "Please contact WRINGG as soon as possible if there is a concern with an order. We will review the matter and try to resolve it fairly during the pilot.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    description: "Pickup and delivery details for WRINGG clothing-care orders.",
    updated: "May 24, 2026",
    sections: [
      {
        heading: "Pickup and drop",
        body: [
          "WRINGG coordinates doorstep pickup and delivery within active service zones. The pilot is currently focused on BTM Layout, Bengaluru.",
          "Pickup and delivery times are estimated and may depend on partner availability, order volume, weather, traffic, and service-zone coverage.",
        ],
      },
      {
        heading: "Timelines",
        body: [
          "Estimated timelines will be shared during booking or order confirmation. Exact timelines are not guaranteed during the pilot.",
        ],
      },
      {
        heading: "Service zone limits",
        body: [
          "Orders outside active service zones may be declined, rescheduled, or handled only if operationally feasible.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact WRINGG",
    description: "Reach WRINGG for bookings, partner interest, and support.",
    updated: "November 11, 2026",
    sections: [
      {
        heading: "Company details",
        body: [
          companyDetails.name,
          `Official address: ${companyDetails.address}`,
        ],
      },
      {
        heading: "Support",
        body: [
          "WhatsApp or phone: +91 84385 08211",
          "Email: hello@wringg.in",
          "Pilot service area: BTM Layout, Bengaluru",
        ],
      },
      {
        heading: "Bookings and partners",
        body: [
          "Customers can contact us for pickup, wash, iron, and delivery requests within active service zones.",
          "Local partners and home-based hosts can contact us to join the BTM pilot partner network.",
        ],
      },
    ],
  },
  deletion: {
    "title": "Delete Your WRINGG Account",
    "description": "Request deletion of your Wringg Customer App or Wringg Partner account, including when you cannot access the app.",
    "updated": "November 10, 2026",
    "links": [
      {
        "href": "mailto:hello@wringg.in?subject=Account%20deletion%20request&body=Please%20delete%20my%20WRINGG%20account%20and%20review%20associated%20personal%20data.%0AApp%3A%20Customer%20or%20Partner%0ARegistered%20phone%20number%3A%20",
        "label": "Email a deletion request"
      },
      {
        "href": "/privacy",
        "label": "Read the privacy policy"
      }
    ],
    "sections": [
      {
        "heading": "Request in the app",
        "body": [
          "In an updated Wringg Customer App or Wringg Partner app, open Profile, choose Delete account, read the notice and confirm Request Deletion. This records a request for the signed-in account. It does not immediately erase your account or all associated records.",
          "The customer app lets you refresh your saved request status. Keep the request reference if one is shown. A pending or processing message is not confirmation of completed deletion."
        ]
      },
      {
        "heading": "Request without the app",
        "body": [
          "Email hello@wringg.in with the subject Account deletion request. State whether you use the Customer or Partner app and include the phone number registered to your account so we can arrange ownership verification. You do not need to reinstall the app. You can also call or WhatsApp +91 84385 08211 for help.",
          "Do not send passwords, login or delivery OTPs, bank credentials or identity-document images by email. Support may need to verify that you own the account before processing the request."
        ]
      },
      {
        "heading": "What happens next",
        "body": [
          "Once the app records a request, new bookings or partner assignments are blocked. Access may remain temporarily so you can complete existing service, payment or dispute responsibilities.",
          "Active orders, unpaid amounts, unresolved complaints or refunds, payment exceptions, and unsettled partner earnings or payouts can delay closure. Eligible in-app requests are checked automatically for core account cleanup. Contact support if a request remains pending, for an expected timeframe, or for a separate review of retained records and provider-held copies.",
          "We do not promise deletion within seven business days. Uninstalling the app, logging out, sending an email or seeing a pending request does not mean deletion is complete. Account closure cannot be undone once eligible information has been erased."
        ]
      },
      {
        "heading": "Information cleared during account closure",
        "body": [
          "The account-cleanup process removes or replaces ordinary profile names and contact details, saved address details and locations, mutable payout and onboarding details, notification tokens, unused login-session information and specified optional-analytics links before closing the login.",
          "A non-login account reference remains to preserve relationships in historical transactions and audit records. This is a pseudonymous reference, not a promise that all retained records are anonymous."
        ]
      },
      {
        "heading": "Information retained and separate deletion review",
        "body": [
          "Historical orders and proof photos, payment and cash records, earnings and settlement records, audit and state history, fraud-related records and partner verification documents are not automatically erased by account closure. These categories currently have no fixed automatic expiry.",
          "Some records may be needed for transactions, disputes or applicable recordkeeping duties. This does not mean that indefinite retention of every item is legally required. Ask hello@wringg.in for a separate review of retained personal information; support should explain the outcome and any applicable restriction.",
          "Didit-held verification data, other provider records, backups and previously exported analytics may require separate handling. Closing your WRINGG login does not confirm that every provider-held copy has been deleted. The 90-day cleanup job for raw referral visits and interaction events is currently paused; automatic expiry is not currently assured."
        ]
      },
      {
        "heading": "Questions or a delayed request",
        "body": [
          "Contact hello@wringg.in or +91 84385 08211 for verification, a status update, correction, review of retained records or help with provider-held information. Include your request reference if available, but do not send credentials.",
          "The Privacy Policy describes the information used for customer service, partner verification, order photos, notifications, referrals and optional analytics."
        ]
      }
    ]
  },
};
