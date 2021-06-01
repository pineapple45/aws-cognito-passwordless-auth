import React, { useState, useEffect, ComponentProps } from 'react';
import { Form, FormLabel } from 'react-bootstrap';
import { Input as InputTypes } from '../types/Input';

const Input: React.FC<InputTypes> = ({
  label,
  inputType,
  placeholder,
  controlId,
  inputCall,
  defaultValue,
  required = true,
}) => {
  const [input, setInput] = useState<ComponentProps<typeof FormLabel>['type']>(
    defaultValue ? defaultValue : null
  );
  const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    inputCall(input);
  }, [input]);

  return (
    <Form.Group controlId={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => inputHandler(e)}
        type={inputType}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
      />
    </Form.Group>
  );
};

export default Input;
