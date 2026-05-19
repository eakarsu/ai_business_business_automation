// Validation utilities

export type ValidationRule = (value: any) => string | null;

export const required = (fieldName: string): ValidationRule => (value) => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const email: ValidationRule = (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email address';
  }
  return null;
};

export const minLength = (min: number, fieldName: string): ValidationRule => (value) => {
  if (!value) return null;
  if (String(value).length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
};

export const maxLength = (max: number, fieldName: string): ValidationRule => (value) => {
  if (!value) return null;
  if (String(value).length > max) {
    return `${fieldName} must be at most ${max} characters`;
  }
  return null;
};

export const pattern = (regex: RegExp, message: string): ValidationRule => (value) => {
  if (!value) return null;
  if (!regex.test(String(value))) {
    return message;
  }
  return null;
};

export const minValue = (min: number, fieldName: string): ValidationRule => (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (Number(value) < min) {
    return `${fieldName} must be at least ${min}`;
  }
  return null;
};

export const passwordStrength: ValidationRule = (value) => {
  if (!value) return null;
  const errors: string[] = [];
  if (value.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(value)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(value)) errors.push('a number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) errors.push('a special character');
  if (errors.length > 0) {
    return `Password must contain ${errors.join(', ')}`;
  }
  return null;
};

// Validate a value against multiple rules
export function validate(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

// Validate a form object against a schema of rules
export function validateForm(
  values: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, rules] of Object.entries(schema)) {
    const error = validate(values[field], rules);
    if (error) errors[field] = error;
  }
  return errors;
}
