import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type DatePickerInputProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  placeholderTextColor?: string;
};

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  style,
  textStyle,
  placeholderTextColor = '#999',
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date | null>(value);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<TextInput>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showWebPicker, setShowWebPicker] = useState(false);

  // Formatear fecha a DD/MM/YYYY para mostrar
  const formatDisplayDate = useCallback((date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Formatear fecha a YYYY-MM-DD para el input date
  const formatToInputDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Actualizar el valor interno cuando cambia el valor externo
  useEffect(() => {
    if (value) {
      setInternalDate(value);
      setInputValue(formatDisplayDate(value));
    } else {
      setInternalDate(null);
      setInputValue('');
    }
  }, [value, formatDisplayDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Cerrar el selector en móviles
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    
    // Manejar la selección de fecha
    if (selectedDate) {
      setInternalDate(selectedDate);
      setInputValue(formatDisplayDate(selectedDate));
      onChange(selectedDate);
    }
    
    // En web, asegurarse de que el evento no se propague
    if (Platform.OS === 'web' && event) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const formatInputDate = (input: string): string => {
    // Eliminar cualquier carácter que no sea número o guión
    let value = input.replace(/[^\d/]/g, '');
    
    // Limitar la longitud máxima
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    // Formatear automáticamente con guiones o barras
    if (value.length > 4) {
      value = value.replace(/^(\d{2})(\d{2})(\d{0,4}).*/, '$1/$2/$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
    }
    
    return value;
  };

  const handleInputChange = (text: string) => {
    // Aplicar formato mientras se escribe
    let formattedText = text.replace(/[^0-9/]/g, ''); // Solo números y barras
    
    // Limitar la longitud
    if (formattedText.length > 10) {
      formattedText = formattedText.substring(0, 10);
    }
    
    // Aplicar formato automático
    if (formattedText.length > 2 && formattedText.indexOf('/') === -1) {
      formattedText = formattedText.substring(0, 2) + '/' + formattedText.substring(2);
    }
    if (formattedText.length > 5) {
      formattedText = formattedText.substring(0, 5) + '/' + formattedText.substring(5, 9);
    }
    
    setInputValue(formattedText);
    
    // Intentar analizar la fecha cuando se completa el formato DD/MM/YYYY
    if (formattedText.length === 10) {
      const [day, month, year] = formattedText.split('/').map(Number);
      
      // Validar que los valores sean números válidos
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        // Los meses en JavaScript van de 0 a 11
        const newDate = new Date(year, month - 1, day);
        
        // Validar que la fecha sea válida
        if (!isNaN(newDate.getTime()) && 
            newDate.getDate() === day &&
            newDate.getMonth() === month - 1 &&
            newDate.getFullYear() === year) {
          setInternalDate(newDate);
          onChange(newDate);
          return;
        }
      }
    }
    
    // Si llegamos aquí, la fecha no es válida o está incompleta
    if (internalDate) {
      setInternalDate(null);
      onChange(new Date(''));
    }
  };

  // Configurar el input de fecha en el montaje
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Crear el input de fecha una sola vez
      const input = document.createElement('input');
      input.type = 'date';
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      input.style.zIndex = '9999';
      
      // Configurar el manejador de cambios
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          const selectedDate = new Date(target.value);
          setInternalDate(selectedDate);
          setInputValue(formatDisplayDate(selectedDate));
          onChange(selectedDate);
        }
        setShowWebPicker(false);
      };
      
      // Agregar al DOM
      document.body.appendChild(input);
      dateInputRef.current = input;
      
      // Limpieza al desmontar
      return () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };
    }
  }, [formatDisplayDate, onChange]);
  
  const showDatepicker = useCallback((e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (Platform.OS === 'web') {
      const input = dateInputRef.current;
      if (input) {
        // Establecer la fecha actual si no hay una seleccionada
        if (internalDate) {
          input.value = formatToInputDate(internalDate);
        } else {
          input.value = ''; // Limpiar si no hay fecha
        }
        
        // Mostrar el picker
        input.click();
      }
    } else {
      // Para móviles, mostrar el selector nativo
      setShowDatePicker(true);
    }
  }, [internalDate, formatToInputDate]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          id="birth-date-input"
          style={[styles.input, textStyle]}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="birthdate-full"
          onFocus={() => {
            if (Platform.OS === 'web') {
              // En web, mostrar el selector de fechas
              if (inputRef.current) {
                inputRef.current.blur();
              }
              showDatepicker();
            }
          }}
        />
        <TouchableOpacity 
          onPress={showDatepicker} 
          style={styles.iconButton}
          data-datepicker-button="true"
          onPressIn={(e) => {
            // Prevenir el foco en el botón
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Ionicons name="calendar" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={internalDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  iconButton: {
    padding: 12,
    height: '100%',
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
  },
  datePickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default DatePickerInput;
