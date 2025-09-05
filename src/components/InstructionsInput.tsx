'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus } from 'lucide-react';

interface InstructionsInputProps {
  value: string[];
  onChange: (instructions: string[]) => void;
  locale: string;
}

const PREDEFINED_INSTRUCTIONS = {
  en: [
    'Simplify this recipe',
    'Make it vegetarian',
    'Make it vegan',
    'Make it gluten-free',
    'Make it dairy-free',
    'Reduce cooking time',
    'Make it healthier',
    'Convert to metric',
    'Make it for beginners',
    'Make it spicy',
    'Make it mild',
    'Double the recipe',
    'Halve the recipe',
    'Make it low-carb',
    'Make it keto-friendly',
    'Remove nuts',
    'Make it kid-friendly',
    'Make it one-pot',
    'Make it quick (under 30 min)',
    'Make it slow-cooker friendly'
  ],
  cs: [
    'Zjednodušte tento recept',
    'Udělejte vegetariánský',
    'Udělejte veganský',
    'Udělejte bezlepkový',
    'Udělejte bez laktózy',
    'Zkraťte dobu vaření',
    'Udělejte zdravější',
    'Převeďte na metrické jednotky',
    'Udělejte pro začátečníky',
    'Udělejte pálivý',
    'Udělejte mírný',
    'Zdvojnásobte recept',
    'Rozpulte recept',
    'Udělejte nízkosacharidový',
    'Udělejte keto-friendly',
    'Odstraňte ořechy',
    'Udělejte vhodný pro děti',
    'Udělejte v jednom hrnci',
    'Udělejte rychlý (pod 30 min)',
    'Udělejte vhodný pro pomalý hrnec'
  ]
};

export default function InstructionsInput({ value, onChange, locale }: InstructionsInputProps) {
  const t = useTranslations();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const predefinedOptions = PREDEFINED_INSTRUCTIONS[locale as keyof typeof PREDEFINED_INSTRUCTIONS] || PREDEFINED_INSTRUCTIONS.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addInstruction = (instruction: string) => {
    if (instruction.trim() && !value.includes(instruction.trim())) {
      onChange([...value, instruction.trim()]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeInstruction = (instructionToRemove: string) => {
    onChange(value.filter(instruction => instruction !== instructionToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInstruction(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const filteredSuggestions = predefinedOptions.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.includes(option)
  );

  return (
    <div className="space-y-3">
      <label htmlFor="recipe-instructions" className="block text-sm font-medium text-gray-900">
        {t('home.instructionsLabel')}
      </label>
      
      {/* Selected Instructions Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((instruction, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
            >
              {instruction}
              <button
                type="button"
                onClick={() => removeInstruction(instruction)}
                className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyPress}
          placeholder={t('home.instructionsPlaceholder')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-colors"
        />
        
        {/* Add Button */}
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => addInstruction(inputValue)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-orange-600 hover:bg-orange-100 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addInstruction(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-orange-50 text-gray-900 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        {t('home.instructionsHelp')}
      </p>
    </div>
  );
}
