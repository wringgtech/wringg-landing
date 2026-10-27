export type LegalPageContent = {
  title: string;
  description: string;
  updated: string;
  sections: {
    heading: string;
    body: string[];
  }[];
};

export const legalPages: Record<string, LegalPageContent> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "How WRINGG collects and uses basic customer and order information for the BTM Layout pilot.",
    updated: "May 24, 2026",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "WRINGG may collect your name, phone number, address, pickup and delivery details, service preferences, and order notes when you contact us or book a service.",
          "We may also keep basic communication records from WhatsApp, phone, email, or other customer support channels.",
        ],
      },
      {
        heading: "How we use information",
        body: [
          "We use this information to confirm orders, coordinate pickup and delivery, share order updates, improve our pilot operations, and respond to customer or partner requests.",
          "We do not sell personal information. We may share only the details needed with local partners who help complete your service.",
        ],
      },
      {
        heading: "Data care",
        body: [
          "We use reasonable care to keep order and contact data limited to service operations. You can contact us to request correction or deletion of your basic information where applicable.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    description: "Simple usage terms for WRINGG customers and local partners.",
    updated: "May 24, 2026",
    sections: [
      {
        heading: "Service usage",
        body: [
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
    updated: "October 27, 2026",
    sections: [
      {
        heading: "Support",
        body: [
          "WhatsApp or phone: +91 84385 08211",
          "Email: contact@wringg.in",
          "Service area: BTM Layout, Bengaluru",
        ],
      },
      {
        heading: "Registered company address",
        body: [
          "WRINGG NETWORKS PRIVATE LIMITED",
          "101, Oxford Towers, 139/88, HAL Old Airport Road,",
          "Hulsur Bazaar, Bangalore North, Bengaluru - 560008",
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
};
