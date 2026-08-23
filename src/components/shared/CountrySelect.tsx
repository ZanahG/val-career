import {useEffect,useRef,useState} from "react";
import {COUNTRIES} from "../../data/countries";
import "../../styles/CountrySelect.css";

interface CountrySelectProps {
  value:string;
  language:"es"|"en";
  onChange:(country:string) => void;
}

export function CountrySelect({value,language,onChange}:CountrySelectProps) {
  const [open,setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((country) => country.name.en === value || country.name.es === value) ?? COUNTRIES.find((country) => country.code === "CL");

  useEffect(() => {
    const handleClickOutside = (event:MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown",handleClickOutside);
    return () => document.removeEventListener("mousedown",handleClickOutside);
  },[]);

  return (
    <div ref={ref} className="country-select">
      <button type="button" className={`country-select__trigger ${open ? "country-select__trigger--open" : ""}`} onClick={() => setOpen(!open)}>
        <span className="country-select__value">{selected && <img className="country-select__flag" src={`https://flagcdn.com/${selected.code.toLowerCase()}.svg`} alt="" />}<strong>{selected?.name[language]}</strong></span>
        <span className="country-select__arrow">⌄</span>
      </button>

      {open && (
        <div className="country-select__menu">
          {COUNTRIES.map((country) => {
            const active = selected?.code === country.code;

            return (
              <button key={country.code} type="button" className={`country-select__option ${active ? "country-select__option--active" : ""}`} onClick={() => {onChange(country.name.en);setOpen(false)}}>
                <img className="country-select__flag" src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} alt="" />
                <strong>{country.name[language]}</strong>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}