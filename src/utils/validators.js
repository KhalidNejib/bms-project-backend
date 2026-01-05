import Joi from 'joi'

export const registerSchema = Joi.object({
    name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
        'string.empty':"Name is required.",
        'string.min': "Name must be atleast 3 characters",
        'string.max':" Name cannot exceed 100 characters"
}),
      email: Joi.string()
     .email()
     .required()
     .messages({ 
        'string.empty': "Email is required",
        'string.email': "Please provide a valid email"
}),
    password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
        'string.empty': "Password is required",
        'string.min': "Password must be atleast 6 characters",
        'string.max': "Password must not exceed 128 characters"
 }),
     phone: Joi.string()
        .pattern(/^[0-9\+\-\s\(\)]{10,20}$/)
        .allow('', null)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
 }),
    department: Joi.string()
    .max(100)
    .allow('', null),

    role: Joi.string()
    .valid('admin', 'staff', 'manager')
    .default('staff')
})
   
export const loginSchema = Joi.object({ 
    email: Joi.string()
    .email()
    .required()
    .messages({ 
        'string.empty':"Email is required",
        'string.email':"Please provide a valid email address"
}),
    password: Joi.string()
    .required()
    .messages({ 
        'string.empty':"Password is required"
    })
})

export const validate = (schema) => {
    return (req, res, next) => { 
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        })
        
        if (error) { 
            const errors = error.details.map(detail => ({ 
                field: detail.path[0],
                message: detail.message.replace(/['"]/g, '')
            })) 
            
            
            return res.status(400).json({ 
                success: false,  // 
                message: "Validation failed",
                errors
            })
        }
        
      
        req.body = value
        next()
    }
}