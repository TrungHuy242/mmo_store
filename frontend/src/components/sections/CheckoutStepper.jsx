/**
 * Checkout Stepper Component
 * Multi-step checkout: Cart Review → Shipping/Billing → Payment Method → Confirmation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store';
import { Button, Card, Input, Badge } from '../common';

const STEPS = [
  { id: 'review', label: 'Review', icon: '🛒' },
  { id: 'shipping', label: 'Shipping', icon: '📍' },
  { id: 'payment', label: 'Payment', icon: '💳' },
  { id: 'confirm', label: 'Confirm', icon: '✓' },
];

export const CheckoutStepper = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'bank',
  });

  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    try {
      await onComplete?.(formData);
      // Handle success - show confirmation modal, etc.
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <motion.button
              onClick={() => index <= currentStep && setCurrentStep(index)}
              className={`
                relative z-10 w-12 h-12 rounded-full font-bold text-lg
                flex items-center justify-center transition-all duration-200
                ${
                  index === currentStep
                    ? 'bg-neon-cyan text-dark-bg shadow-glow-cyan scale-110'
                    : index < currentStep
                    ? 'bg-neon-green text-dark-bg'
                    : 'bg-dark-secondary text-text-tertiary border border-white/15'
                }
                ${index < currentStep ? 'cursor-pointer' : ''}
              `}
              whileHover={index < currentStep ? { scale: 1.1 } : {}}
              whileTap={index < currentStep ? { scale: 0.95 } : {}}
            >
              {index < currentStep ? '✓' : step.icon}
            </motion.button>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <motion.div
                className="flex-1 h-1 mx-2 rounded-full"
                initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                animate={{
                  backgroundColor:
                    index < currentStep
                      ? 'rgb(16, 185, 129)'
                      : 'rgba(255,255,255,0.1)',
                }}
                transition={{ duration: 0.3 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs font-semibold">
        {STEPS.map((step) => (
          <span key={step.id} className="text-text-secondary">
            {step.label}
          </span>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <ReviewStep items={items} total={total} />
          )}
          {currentStep === 1 && (
            <ShippingStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          {currentStep === 2 && (
            <PaymentStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          {currentStep === 3 && (
            <ConfirmStep formData={formData} items={items} total={total} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between pt-6">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          ← Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(0)}
          >
            Reset
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleComplete}
            >
              Complete Order
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext}>
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Step 1: Review Cart
 */
const ReviewStep = ({ items, total }) => {
  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="text-xl font-bold text-text-primary">
        Order Review
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-dark-secondary rounded-lg border border-white/10"
          >
            <div className="flex items-center gap-3 flex-1">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-text-primary">
                  {item.name}
                </p>
                <p className="text-xs text-text-tertiary">
                  Qty: {item.quantity}
                </p>
              </div>
            </div>
            <p className="font-bold text-neon-cyan">
              {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-white/10 pt-4 space-y-2">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span>{total.toLocaleString('vi-VN')} ₫</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Tax (10%)</span>
          <span>{Math.round(total * 0.1).toLocaleString('vi-VN')} ₫</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-neon-cyan pt-2 border-t border-white/10">
          <span>Total</span>
          <span>
            {Math.round(total * 1.1).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </Card>
  );
};

/**
 * Step 2: Shipping & Billing
 */
const ShippingStep = ({ formData, onChange }) => {
  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="text-xl font-bold text-text-primary">
        Shipping Information
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          placeholder="John"
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          placeholder="Doe"
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="john@example.com"
      />

      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        placeholder="+84 123 456 789"
      />

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => onChange('address', e.target.value)}
        placeholder="123 Main Street"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="Hanoi"
        />
        <Input
          label="Postal Code"
          value={formData.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          placeholder="100000"
        />
      </div>
    </Card>
  );
};

/**
 * Step 3: Payment Method Selection
 */
const PaymentStep = ({ formData, onChange }) => {
  const methods = [
    { id: 'balance', label: 'Account Balance', icon: '💰' },
    { id: 'bank', label: 'Bank Transfer (VietQR)', icon: '🏦' },
    { id: 'usdt', label: 'USDT TRC20', icon: '₮' },
    { id: 'card', label: 'Gift Card', icon: '🎟️' },
  ];

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="text-xl font-bold text-text-primary">
        Payment Method
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {methods.map((method) => (
          <motion.button
            key={method.id}
            onClick={() => onChange('paymentMethod', method.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              ${
                formData.paymentMethod === method.id
                  ? 'border-neon-cyan bg-neon-cyan/10 shadow-glow-cyan'
                  : 'border-white/15 hover:border-white/25'
              }
            `}
          >
            <div className="text-2xl mb-2">{method.icon}</div>
            <p className="text-sm font-semibold text-text-primary">
              {method.label}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
        <p className="text-sm text-neon-blue">
          💡 Bank transfers are processed instantly via VietQR. You'll receive
          confirmation within minutes.
        </p>
      </div>
    </Card>
  );
};

/**
 * Step 4: Order Confirmation
 */
const ConfirmStep = ({ formData, items, total }) => {
  return (
    <Card variant="glass" className="space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8"
      >
        <div className="text-6xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-neon-green mb-2">
          Order Ready to Complete
        </h3>
        <p className="text-text-secondary">
          Review your information before finalizing
        </p>
      </motion.div>

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="space-y-3">
          <h4 className="font-bold text-text-primary border-b border-white/10 pb-2">
            Shipping To
          </h4>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">
              {formData.firstName} {formData.lastName}
            </span>
            <br />
            {formData.address}
            <br />
            {formData.city}, {formData.postalCode}
            <br />
            {formData.phone}
          </p>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h4 className="font-bold text-text-primary border-b border-white/10 pb-2">
            Payment Method
          </h4>
          <Badge variant="info" size="md">
            {formData.paymentMethod === 'balance'
              ? 'Account Balance'
              : formData.paymentMethod === 'bank'
              ? 'Bank Transfer'
              : 'USDT TRC20'}
          </Badge>
          <p className="text-xs text-text-tertiary">
            Total: {Math.round(total * 1.1).toLocaleString('vi-VN')} ₫
          </p>
        </div>
      </div>

      {/* Items Summary */}
      <div>
        <h4 className="font-bold text-text-primary border-b border-white/10 pb-2 mb-3">
          Items ({items.length})
        </h4>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-text-secondary"
            >
              <span>
                {item.name} x{item.quantity}
              </span>
              <span className="text-neon-cyan font-semibold">
                {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CheckoutStepper;
