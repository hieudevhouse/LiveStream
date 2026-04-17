const authService = require('../services/auth.service');
const businessOwnerService = require('../services/businessOwner.service');
const productServiceService = require('../services/productService.service');
const collaborationNeedService = require('../services/collaborationNeed.service');
const Voucher = require('../models/Voucher');

function parseKeywords(rawKeywords) {
  if (!rawKeywords) return [];
  if (Array.isArray(rawKeywords)) return rawKeywords.map((k) => String(k).trim()).filter(Boolean);
  return String(rawKeywords)
    .split(/[,;\n]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function parseBooking(booking = {}) {
  const result = {
    selectedChannel: booking.selectedChannel || '',
    bookings: [],
    campaignGoal: booking.campaignGoal || '',
    budgetNote: booking.budgetNote || '',
    videoNote: booking.videoNote || '',
    videoFileName: booking.videoFileName || '',
    totalPrice: Number(booking.totalPrice) || 0,
  };

  if (Array.isArray(booking.bookings)) {
    result.bookings = booking.bookings.map((item) => ({
      slotCode: item.slotCode || item.slot || '',
      channel: item.channel || '',
      timeRange: item.timeRange || '',
      durationSeconds: Number(item.durationSeconds) || Number(item.duration) || undefined,
      unitPrice: Number(item.unitPrice) || Number(item.price) || undefined,
      quantity: Number(item.quantity) || 1,
    }));
  }

  if (!result.totalPrice) {
    result.totalPrice = result.bookings.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  }

  return result;
}

function buildBusinessOwnerPayload(businessInfo = {}) {
  const email = (businessInfo.email || businessInfo.contactRepresentative?.email || businessInfo.individualEmail || businessInfo.otherRepresentative?.email || '').trim();

  return {
    userId: businessInfo.userId || '',
    ownershipType: businessInfo.ownershipType || 'business',
    businessName: businessInfo.businessName || '',
    taxCode: businessInfo.taxCode || '',
    address: businessInfo.address || '',
    phone: businessInfo.phone || '',
    email,
    website: businessInfo.website || '',
    logo: businessInfo.logo || '', // Logo file path
    legalRepresentative: {
      name: businessInfo.legalRepresentative?.name || '',
      idNumber: businessInfo.legalRepresentative?.idNumber || '',
      position: businessInfo.legalRepresentative?.position || '',
    },
    contactRepresentative: {
      name: businessInfo.contactRepresentative?.name || '',
      phone: businessInfo.contactRepresentative?.phone || '',
      email: (businessInfo.contactRepresentative?.email || email).trim(),
    },
    businessVerification: {
      leiCode: businessInfo.businessVerification?.leiCode || '',
      businessRegistrationScan: businessInfo.businessVerification?.businessRegistrationScan || '',
    },
    individualName: businessInfo.individualName || '',
    individualIdNumber: businessInfo.individualIdNumber || '',
    individualTaxCode: businessInfo.individualTaxCode || '',
    individualAddress: businessInfo.individualAddress || '',
    individualPhone: businessInfo.individualPhone || '',
    individualEmail: businessInfo.individualEmail || '',
    otherDescription: businessInfo.otherDescription || '',
    otherRepresentative: {
      name: businessInfo.otherRepresentative?.name || '',
      idNumber: businessInfo.otherRepresentative?.idNumber || '',
      address: businessInfo.otherRepresentative?.address || '',
      phone: businessInfo.otherRepresentative?.phone || '',
      email: businessInfo.otherRepresentative?.email || '',
    },
  };
}

function buildProductServicePayload(productService = {}, businessOwnerId = '', bookingPayload = {}) {
  const baseCost = Number(
    productService.baseCost != null
      ? productService.baseCost
      : productService.price || 0
  );

  return {
    businessOwnerId,
    name: productService.productName || productService.name || '',
    type: productService.productType || productService.type || 'product',
    businessField: productService.businessField || '',
    description: {
      general: productService.generalDescription || productService.description || '',
      keywords: parseKeywords(productService.keywords),
      images: productService.images || [],
      documents: productService.certificateFiles || []
    },
    certifications: productService.certificatesAwards
      ? [{ name: String(productService.certificatesAwards).trim() }]
      : [],
    socialChannels: productService.mainSocialChannel
      ? [{ platform: 'primary', url: String(productService.mainSocialChannel).trim() }]
      : [],
    pricing: {
      baseCost: Number.isFinite(baseCost) ? baseCost : 0,
      currency: 'VND',
    },
    booking: bookingPayload,
    mediaFilesDescription: productService.mediaFilesDescription || '',
    vouchers: Array.isArray(productService.vouchers) 
      ? productService.vouchers.filter(v => v.code).map(v => ({
          code: v.code,
          quantity: Number(v.quantity) || 0,
          startDate: v.startDate ? new Date(v.startDate) : null,
          expiryDate: v.expiryDate ? new Date(v.expiryDate) : null,
          value: Number(v.value) || 0
        }))
      : []
  };
}

const renderRegister = (req, res) => {
  res.render('register', {
    pageTitle: 'Dreamax | Đăng ký nhãn hàng và sản phẩm',
  });
};

const submitRegistration = async (req, res) => {
  try {
    const { businessInfo = {}, productService = {}, productServices = [], booking = {}, collaborationNeeds = {} } = req.body;

    // Xử lý file upload
    if (req.files && req.files.length > 0) {
      const fileMap = new Map();
      
      // Nhóm files theo field name
      req.files.forEach(file => {
        if (!fileMap.has(file.fieldname)) {
          fileMap.set(file.fieldname, []);
        }
        fileMap.get(file.fieldname).push(file.path);
      });

      // Xử lý logo nhãn hàng
      if (fileMap.has('businessInfo[logo]')) {
        businessInfo.logo = fileMap.get('businessInfo[logo]')[0];
      }

      // Xử lý files sản phẩm
      if (Array.isArray(productServices)) {
        productServices.forEach((product, index) => {
          const imageField = `productServices[${index}][images]`;
          const certField = `productServices[${index}][certificateFiles]`;
          
          if (fileMap.has(imageField)) {
            product.images = fileMap.get(imageField);
          }
          if (fileMap.has(certField)) {
            product.certificateFiles = fileMap.get(certField);
          }
        });
      }
    }

    const email = (businessInfo.email || businessInfo.contactRepresentative?.email || businessInfo.individualEmail || businessInfo.otherRepresentative?.email || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email liên hệ.' });
    }

    const authResult = await authService.registerAuto(email);
    const userId = authResult.user._id.toString();

    const businessOwnerPayload = buildBusinessOwnerPayload({ ...businessInfo, userId });
    const businessOwner = await businessOwnerService.upsert(businessOwnerPayload);

    const bookingPayload = parseBooking(booking);

    const validProductServices = Array.isArray(productServices)
      ? productServices.filter((item) => item && (item.productName || item.name))
      : [];
    const fallbackProductService = productService && (productService.productName || productService.name) ? [productService] : [];
    const productServiceEntries = validProductServices.length > 0 ? validProductServices : fallbackProductService;

    if (productServiceEntries.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất một sản phẩm/dịch vụ.' });
    }

    const createdProductServices = [];
    for (const item of productServiceEntries) {
      const payload = buildProductServicePayload(item, businessOwner._id.toString(), bookingPayload);
      const createResult = await productServiceService.create(payload);
      const newProduct = createResult.productService;
      createdProductServices.push(newProduct);

      // Cập nhật vào bảng Voucher (standalone)
      if (newProduct.vouchers && newProduct.vouchers.length > 0) {
        for (const v of newProduct.vouchers) {
          try {
            await Voucher.findOneAndUpdate(
              { code: v.code.toUpperCase() },
              {
                code: v.code.toUpperCase(),
                name: `Voucher cho ${newProduct.name}`,
                discountType: 'fixed',
                discountValue: v.value,
                usageLimit: v.quantity,
                validFrom: v.startDate,
                validUntil: v.expiryDate,
                applicableProduct: newProduct._id,
                isActive: true
              },
              { upsert: true, new: true }
            );
          } catch (vErr) {
            console.error(`Lỗi khi cập nhật bảng Voucher cho mã ${v.code}:`, vErr.message);
          }
        }
      }
    }
    const createdProductService = createdProductServices[0];

    let collaborationNeed = null;
    if (Array.isArray(collaborationNeeds.needs) && collaborationNeeds.needs.length > 0) {
      const needs = collaborationNeeds.needs
        .filter((item) => item && item.type)
        .map((item) => ({
          type: item.type,
          description: item.description || '',
        }));

      if (needs.length > 0) {
        const upsertedNeeds = await Promise.all(
          createdProductServices.map((product) =>
            collaborationNeedService.upsertCollaborationNeed({
              businessOwnerId: businessOwner._id.toString(),
              productServiceId: product._id.toString(),
              needs,
            })
          )
        );
        collaborationNeed = upsertedNeeds[0];
      }
    }

    return res.json({
      success: true,
      message: 'Đăng ký thành công. Chúng tôi đã lưu thông tin của bạn.',
      userId,
      businessOwnerId: businessOwner._id,
      productServiceIds: createdProductServices.map((item) => item._id.toString()),
      productServiceId: createdProductService._id.toString(),
      collaborationNeedId: collaborationNeed?._id || null,
      isDuplicateUser: authResult.isDuplicate,
    });
  } catch (error) {
    console.error('Registration submit error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi không xác định khi gửi yêu cầu đăng ký.',
    });
  }
};

module.exports = { renderRegister, submitRegistration };
