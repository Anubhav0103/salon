const Joi = require('joi');

function validate(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
}

// Schemas

const userRegisterSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(4).required()
});

const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const businessRegisterSchema = Joi.object({
    salon_name: Joi.string().required(),
    salon_address: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required()
});

const businessLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const businessUpdateSchema = Joi.object({
    salon_name: Joi.string().required(),
    salon_address: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required()
});

// ✅ Separate schemas for create and update
const serviceCreateSchema = Joi.object({
    business_id: Joi.number().required(),
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    duration: Joi.number().required(),
    price: Joi.number().required()
});

const serviceUpdateSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    duration: Joi.number().required(),
    price: Joi.number().required()
});

// ✅ Extended staff schema to match frontend
const staffSchema = Joi.object({
    business_id: Joi.number().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    role: Joi.string().required(),
    specializations: Joi.string().allow('', null),
    working_days: Joi.string().allow('', null),
    working_hours_start: Joi.string().required(),
    working_hours_end: Joi.string().required()
});

const bookingSchema = Joi.object({
    service_id: Joi.number().required(),
    staff_id: Joi.number().required(),
    date: Joi.string().required(),
    time: Joi.string().required()
});

const assignServiceSchema = Joi.object({
    staff_id: Joi.number().required(),
    service_id: Joi.number().required()
});

const searchWithDateSchema = Joi.object({
    service_names: Joi.array().items(Joi.string()).min(1).required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    booking_date: Joi.string().required(),
    day_name: Joi.string().required()
  });
  

module.exports = {
    validate,
    schemas: {
        userRegisterSchema,
        userLoginSchema,
        businessRegisterSchema,
        businessLoginSchema,
        businessUpdateSchema,
        serviceCreateSchema,
        serviceUpdateSchema,
        staffSchema,
        bookingSchema,
        assignServiceSchema,
        searchWithDateSchema
    }
};
