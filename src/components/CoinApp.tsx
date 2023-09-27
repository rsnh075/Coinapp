import { useState, useEffect } from 'react';
import './CoinApp.css'
import {
    FaCopy,
    FaRedo,
    FaChevronDown,
    FaChevronUp,
} from 'react-icons/fa';
import {
    RxMagnifyingGlass,
} from 'react-icons/rx';
import { COIN_LABELS } from "../settings/langlabels";

const isProd = import.meta.env.PROD;

import testdata from '../components/testdata'; //Dont forget to comment this line;

const filters = [
    "NameSearch",
    "FirstName",
    "Prefix",
    "LastName",
    "FamilyName",
    "CompanyName",
    "Street",
    "HouseNumber",
    "Postcode",
    "City",
    "Province",
    "FirstName",
    "Prefix",
    "LastName",
    "FamilyName"];

// const oneRequiredfilter = [
//     "Company",
//     "FirstName",
//     "LastName"
// ];
// const standalonefilter = [
//     "street",
//     "city",
//     "postcode"
// ];
// const combifilters = [
//     ["postcode"],
//     ["postcode", "houseNumber"],
//     ["city"],
//     ["city", "province"],
//     ["street"],
//     ["street", "city"],
//     ["street", "city", "province"],
//     ["street", "houseNumber"],
//     ["street", "houseNumber", "city"],
//     ["street", "houseNumber", "city", "province"]
// ];

interface ErrorCodesType {
    '-1': string;
    '-10': string;
    '110': string;
    '111': string;
    '112': string;
    '113': string;
    '114': string;
    '115': string;
  }

const ErrorCodes: ErrorCodesType = {
    '-1' : 'Invalid parameters',
    '-10' : 'APIRequestError',
    '110' : 'Invalid input',
    '111' : 'Name fields missing',
    '112' : 'Invalid combination of name fields',
    '113' : 'Address fields missing',
    '114' : 'Invalid combination of address fields',
    '115' : 'Duplicate fields',
}

interface ValueType {
    Value: string
}

interface Filters {
    NameSearch : ValueType;
    companyName : ValueType;
    city : ValueType;
    municipality : ValueType;
    street : ValueType;
    houseNumber : ValueType;
    postcode : ValueType;
    province : ValueType;
    firstName : ValueType;
    prefix : ValueType;
    lastName : ValueType;
    familyName : ValueType;
}

interface ResultRow {
    id: number;
    familyName: string;
    companyName : string;
    phoneNumber : string;
    street : string;
    houseNumber : string;
    houseNumberAddition : string;
    postcode : string;
    city : string;
}

interface Meta {
    total : number,
    relation : string,
    maxScore : number,
    tookMillis : number
}

interface DataLocComplType {
    street: string,
    houseNumber: string,
    houseNumberAddition: string,
    postcode: string,
    city: string,
    countryCode: string,
    province: string,
    municipality: string,
}

function CoinApp() {

    const   urlLookUp = isProd ? "./info/subscriberlookup" : "",
            urlNamesCompl = isProd ? "./info/namescompletion" : "",
            urlLocCompl = isProd ? "./info/locationcompletion" : "",
            requestSize = 50,
            [queryFields, setQueryFields] = useState<Filters>({
                NameSearch: {Value : ''},
                companyName : {Value : ''},
                city : {Value : ''},
                municipality : {Value : ''},
                street : {Value : ''},
                houseNumber : {Value : ''},
                postcode : {Value : ''},
                province : {Value : ''},
                firstName : {Value : ''},
                prefix : {Value : ''},
                lastName : {Value : ''},
                familyName : {Value : ''},
            }),
            [metaData, setMetadata] = useState<Meta | null>(null),
            totalHits = metaData?.total ?? '0',
            [tryReload, setTryReload] = useState(true),
            [data, setData] = useState<[] | null>(null),
            // [rawData, setRawData] = useState<any[] | null>(null), //Dont forget to uncomment this line;
            [namesComplField, setNamesComplField] = useState<string | null>(null),
            [dataNamesCompl, setDataNamesCompl] = useState<any[] | null>(null),
            // [rawNamesComplData, setRawNamesComplData] = useState<object | null>(null),
            [locComplField, setLocComplField] = useState<string>(''),
            [dataLocCompl, setDataLocCompl] = useState<DataLocComplType[] | null>(null),
            // [rawLocComplData, setRawLocComplData] = useState<object | null>(null),
            [code, setCode] = useState<string>(''),
            [errordescription, setErrordescription] = useState<string>('');

    const handleInputChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
            setQueryFields({
            ...queryFields,
            [name]: {
                ...queryFields[name as keyof Filters],
                Value: value,
            },
        });
    };

    const resetData = () => {
        setData(null);
        // setRawData(null); //Dont forget to uncomment this line;
        setMetadata(null);
        setDataLocCompl(null);
        // setRawLocComplData(null);
        setDataNamesCompl(null);
        // setRawNamesComplData(null);
    }

    const [filterDropDownIsOpen, setFilterDropDownIsOpen] = useState(false);

    const filterDropDownToggle = () => {
        setFilterDropDownIsOpen(!filterDropDownIsOpen);
    }

    const lowercaseFirstLetter = (str:string) => {
        const _str = str.charAt(0).toLowerCase() + str.slice(1);
        return _str;
    }

    const getLocComplBody = (field:string) => {
        const _body = { "Query" : queryFields[field as keyof Filters].Value, "Fields" : [{ FieldName: field}], "Size" : requestSize };
        return JSON.stringify(_body);
    };

    const getNamesComplBody = (field:string) => {
        const _body = { "Query" : queryFields[field as keyof Filters].Value, "Field" : field, "MinDocCount" : null, "Size" : requestSize };
        return JSON.stringify(_body);
    };

    const getBody = () => {
        const _body = { "Query" : {} as Filters, "From": null, "Size": requestSize };
        filters.forEach((filter:string) => {
            const filterName:string = filter !== 'NameSearch' ? lowercaseFirstLetter(filter) : filter;
            if ( queryFields[filterName as keyof Filters] && queryFields[filterName as keyof Filters].Value !== '') {
                _body.Query[filter as keyof Filters] = queryFields[filterName as keyof Filters];
            }
        });
        console.log('data: ', _body);
        return JSON.stringify(_body);
    };

    const handleLocComplData = (field:string, data:object[]) => {
        const _data = data.reduce((acc:any, row:any) => {
            const _row:any = {};
            if (field == 'street') {
                if ( row.street && row.street !== '' ) {
                    _row.street = row.street;
                }
                if ( row.parent && row.parent.city && row.parent.city !== ''  ) {
                    _row.city = row.parent.city;
                }
                if ( row.parent && row.parent.province && row.parent.province !== ''  ) {
                    _row.province = row.parent.province;
                }
                if ( row.parent && row.parent.municipality && row.parent.municipality !== ''  ) {
                    _row.municipality = row.parent.municipality;
                }
            }
            if (field == 'city') {
                if ( row.city && row.city !== '' ) {
                    _row.city = row.city;
                }
                if ( row.parent && row.parent.province && row.parent.province !== ''  ) {
                    _row.province = row.parent.province;
                }
                if ( row.parent && row.parent.municipality && row.parent.municipality !== ''  ) {
                    _row.municipality = row.parent.municipality;
                }
            }

            if (Object.keys(_row).length > 0) acc.push(_row);
            return acc;
        }, [])
        return _data;
    }

    const handleRequestData = ():void => {
        setRawData(testdata.data); //Dont forget to comment this line;

        // setData(rawData?.reduce((acc:any, row:any) => { // Uncomment this line for PRODUCTION
        setData(testdata.data?.reduce((acc:any, row:any) => {
            const _row = {} as ResultRow;
            _row.id = row.id;
            if ( row.address && row.address.street !== '' ) {
                _row.street = row.address.street;
            }
            if ( row.address && row.address.houseNumber !== '' ) {
                _row.houseNumber = row.address.houseNumber;
            }
            if ( row.address && row.address.houseNumberAddition !== '' ) {
                _row.houseNumberAddition = row.address.houseNumberAddition;
            }
            if ( row.address && row.address.postcode !== '' ) {
                _row.postcode = row.address.postcode;
            }
            if ( row.address && row.address && row.address.city !== ''  ) {
                _row.city = row.address.city;
            }
            if ( row.company && row.company.name !== '' ) {
                _row.companyName = row.company.name;
            }
            if ( row.phoneNumber && row.phoneNumber !== '' ) {
                _row.phoneNumber = row.phoneNumber;
            }
            if ( row.person && row.person.familyName !== '' ) {
                _row.familyName = row.person.familyName;
            }

            if (Object.keys(_row).length > 0) acc.push(_row);
            return acc;
        }, []));
    }

    const requestLocCompl = async (field:string) => {
        resetErrors();
        try {
            const res = await fetch(urlLocCompl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: getLocComplBody(field),
            });

            const result = await res.json();

            if (!res.ok ||
                result.isError
            ) {
                setCode(result.code && getErrorCode(result.code) !== '' ? 'Error: ' + getErrorCode(result.code) : '');
                setErrordescription(result.description ? result.description : '');
                return;
            }

            const _result = JSON.parse(result.data);
            if (_result) {
                resetData();
                setLocComplField(field);
                setDataLocCompl(handleLocComplData(field, _result));
                queryFields[field as keyof Filters].Value = dataLocCompl ? dataLocCompl[0][field as keyof DataLocComplType] : '';
            }

        }
        catch (err:any) {
            console.error('Caught request error: ' , err.message ? err.message : err);
            console.log('Catch err', err);
            if (tryReload) {
                failedToFetch();
            }
        }
    }

    const requestNamesCompl = async (field:string) => {
        console.log('[[[[[HMMM]]]]]', );
        resetErrors();
        try {
            const res = await fetch(urlNamesCompl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: getNamesComplBody(field),
            });

            const result = await res.json();

            if (!res.ok ||
                result.isError
            ) {
                setCode(result.code && getErrorCode(result.code) !== '' ? 'Error: ' + getErrorCode(result.code) : '');
                setErrordescription(result.description ? result.description : '');
                console.log('Error code: ', code);
                console.log('Error description: ', errordescription);
                return;
            }

            const _result = JSON.parse(result.data);
            if (_result) {
                resetData();
                setNamesComplField(field);
                setDataNamesCompl(_result);
                queryFields[field as keyof Filters].Value = _result[0];
                console.log('dataNamesCompl: ', dataNamesCompl);
            }

        }
        catch (err:any) {
            console.error('Caught request error: ' , err.message ? err.message : err);
            console.log('Catch err', err);
            if (tryReload) {
                failedToFetch();
            }
        }
    }

    const setLocComplVal = (val:string) => {
        queryFields[locComplField as keyof Filters].Value = val;
    }

    const setNamesComplVal = (val:string) => {
        queryFields[namesComplField as keyof Filters].Value = val;
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const makeUrlParam = (str:string, key:string, val:string) => {
        if (str.indexOf('?') > -1) {
            return `&${key}=${val}`;
        }
        else {
            return `?${key}=${val}`;
        }
    }

    const getParamVal = (searchfield:string):string => {
        let _paramval = urlParams.get(searchfield);
        if (_paramval && searchfield == 'companyName' && _paramval == '0') {
            _paramval = '';
        }
        if (!_paramval) return '';
        return decodeURIComponent(_paramval);
    }

    const failedToFetch = () => {
        let _reloadurl = location.protocol + '//' + location.host + location.pathname;
        for (const field in queryFields) {
            if (queryFields[field as keyof Filters].Value.length > 0) {
                _reloadurl += makeUrlParam(_reloadurl, field, queryFields[field as keyof Filters].Value);
            }
        }
        if (urlParams.has('subaccount')) {
            _reloadurl += '&subaccount=' + getParamVal('subaccount');
        }
        //post redirect url to parent
        const message = JSON.stringify({
            channel: 'FROM_FRAME_CLOUDAPP_REDIRECTURL',
            message: `${_reloadurl}&Submit=true`,
            date: Date.now(),
        });
        window.parent.postMessage(message, '*');
    };

    const resetErrors = () => {
        setCode('');
        setErrordescription('');
    }

    const getErrorCode = (code:number) => {
        let _str = '';
        const _code: string = code.toString();
        if (ErrorCodes[_code as keyof ErrorCodesType]) {
            _str = ErrorCodes[_code as keyof ErrorCodesType];
        }
        return _str;
    }

    const requestCoinApiData = async () => {
        resetErrors();
        try {
            const res = await fetch(urlLookUp, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: getBody(),
            });

            const result = await res.json();

            if (!res.ok ||
                result.isError
            ) {
                setCode(result.code && getErrorCode(result.code) !== '' ? 'Error: ' + getErrorCode(result.code) : '');
                setErrordescription(result.description ? result.description : '');
                console.log('Error code: ', code);
                console.log('Error description: ', errordescription);
                return;
            }

            const _result = JSON.parse(result.data);
            if (_result && _result.data && _result.meta) {
                resetData();
                setMetadata(_result.meta);
                setRawData(_result.data);
                console.log('result: ', _result);
                handleRequestData();
            }
        }
        catch (err:any) {
            console.error('Caught request error: ' , err.message ? err.message : err);
            console.log('Catch err', err);
            if (tryReload) {
                failedToFetch();
            }
            handleRequestData(); //Dont forget to comment this line;
        }
    }

    const handleEnterPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            setTryReload(true);
            requestCoinApiData();
        }
    }

    const handleQueryFieldsFromUri = () => {
        for (const field in queryFields) {
            queryFields[field as keyof Filters].Value = urlParams.has(field) ? getParamVal(field) : '';
        }
    }

    const handleReloadUrl = () => {
        handleQueryFieldsFromUri();
        requestCoinApiData();
        setTryReload(false);
    };

    const showToolTip = (_srcField:HTMLInputElement, indx:number, type:string) => {
        const _typeselector = type == 'transfer' ? 'data-coinapp-transfertooltip' : 'data-coinapp-copytooltip';
        if (!_srcField?.parentElement) return;
        const _toolTipEl = _srcField.parentElement.querySelector("[" + _typeselector + "='" + indx + "']") as HTMLSpanElement;
        if (!_toolTipEl) return;
        _toolTipEl.style.opacity = '1';
        setTimeout(() => {
            _toolTipEl.style.opacity = '0';
        }, 1000);
    }

    const handleCopyToClipboard = (evt:React.MouseEvent, index:number) => {
        const _target      = evt.target as HTMLSpanElement,
            _trigger     = [..._target.classList].find(cls => cls.indexOf('--js') != -1);

        if (_trigger === 'coinapp-copy--js') {
            copyToClipboard(index, 'copy');
        }
        if (_trigger === 'coinapp-transfer--js') {
            copyToClipboard(index, 'transfer');
        }
    }

    const copyToClipboard = (indx:number, type:string) => {
        let _flag = -1;
        const _srcField = document.getElementById('coinapp-copytoclipboard-input' + indx.toString()) as HTMLInputElement;
        if (_srcField && _srcField.disabled) {
            _srcField.disabled = false;
            _flag = 1;
        }
        _srcField.select();
        _srcField.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(_srcField.value);
        window.getSelection()?.removeAllRanges();

        if (_flag == 1) {
            _srcField.disabled = true;
        }
        //post number to parent
        if (type == 'transfer') {
            const message = JSON.stringify({
                channel: 'FROM_FRAME_CLOUDAPP_TRANSFERNR',
                message: _srcField.value,
                date: Date.now(),
            });
            window.parent.postMessage(message, '*');
        }
        showToolTip(_srcField, indx, type);
    };

    const checkCompanyName = (row:ResultRow) => {
        let _companyOrFamilyname = '';
        if (row.companyName && row.companyName.length > 0) {
            _companyOrFamilyname = row.companyName;
        }
        else if (row.familyName && row.familyName.length > 0) {
            _companyOrFamilyname = row.familyName;
        }
        return _companyOrFamilyname;
    }

    useEffect(() => {
        if (urlParams.has('Submit') && getParamVal('Submit') == 'true') {
            handleReloadUrl();
        }
        else {
            handleQueryFieldsFromUri();
            if (queryFields.companyName.Value == '') {
                document.getElementById("companyNameInput")?.focus();
            }
            else {
                document.getElementById("cityInput")?.focus();
            }
        }
    }, []);

    return (
        <section className="coinapp-wrapper">
            <div className="coinapp-header-wrapper">
                <div className="coinapp-header">
                    { COIN_LABELS.coinapp.coinappheaderlabel }
                    <button className="coinapp-submitbtn" onClick={() => {setTryReload(true); requestCoinApiData();}}>{ COIN_LABELS.coinapp.submitbuttonlabel }</button>
                </div>
                <div></div>
            </div>
            <form className="coinapp-form" autoComplete="off" aria-autocomplete="none">
                <div className="coinapp-filter-wrapper" onKeyUp={handleEnterPress}>
                    <div className="coinapp-filter-row">
                        <label htmlFor="companyName">{ COIN_LABELS.coinapp.filterlabels[0] }</label>
                        <input type="search" name="companyName" id="companyNameInput" value={queryFields.companyName.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[0]} aria-autocomplete="none" autoComplete="search-company-name" />
                        <RxMagnifyingGlass className="coinapp-input-search" onClick={() => requestNamesCompl('companyName')} />
                    </div>
                    <div className="coinapp-filter-row">
                        <label htmlFor="city">{ COIN_LABELS.coinapp.filterlabels[1] }</label>
                        <input type="search" name="city" id="cityInput" value={queryFields.city.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[1]} aria-autocomplete="none" autoComplete="search-city" />
                        <RxMagnifyingGlass className="coinapp-input-search" onClick={() => requestLocCompl('city')} />
                    </div>
                    <div className={`coinapp-filter-dropdown ${!filterDropDownIsOpen ? 'coinapp-filter-dropdown--minimized' : ''}`}>
                        <div className="coinapp-filter-row coinapp-filter-column">
                            <div className="coinapp-filter-row">
                                <label htmlFor="postcode">{ COIN_LABELS.coinapp.filterlabels[4] }</label>
                                <input type="search" name="postcode" value={queryFields.postcode.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[4]} aria-autocomplete="none" autoComplete="search-postcode" />
                            </div>
                            <div className="coinapp-filter-row">
                                <label htmlFor="houseNumber" className="coinapp-filter-housenumber">{ COIN_LABELS.coinapp.filterlabels[3] }</label>
                                <input type="search" name="houseNumber" value={queryFields.houseNumber.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[3]} aria-autocomplete="none" autoComplete="search-house-number" />
                            </div>
                        </div>
                        <div className="coinapp-filter-row">
                            <label htmlFor="street">{ COIN_LABELS.coinapp.filterlabels[2] }</label>
                            <input type="search" name="street" value={queryFields.street.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[2]} aria-autocomplete="none" autoComplete="search-street" />
                            <RxMagnifyingGlass className="coinapp-input-search" onClick={() => requestLocCompl('street')} />
                        </div>
                        <div className="coinapp-filter-row">
                            <label htmlFor="province">{ COIN_LABELS.coinapp.filterlabels[5] }</label>
                            <input type="search" name="province" value={queryFields.province.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[5]} aria-autocomplete="none" autoComplete="search-province" />
                        </div>

                        <div className="coinapp-filter-row">
                            <label htmlFor="firstName">{ COIN_LABELS.coinapp.filterlabels[6] }</label>
                            <input type="search" name="firstName" value={queryFields.firstName.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[6]} aria-autocomplete="none" autoComplete="search-first-name" />
                        </div>
                        <div className="coinapp-filter-row">
                            <label htmlFor="prefix">{ COIN_LABELS.coinapp.filterlabels[7] }</label>
                            <input type="search" name="prefix" value={queryFields.prefix.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[7]} aria-autocomplete="none" autoComplete="search-prefix" />
                        </div>
                        <div className="coinapp-filter-row">
                            <label htmlFor="lastName">{ COIN_LABELS.coinapp.filterlabels[8] }</label>
                            <input type="search" name="lastName" value={queryFields.lastName.Value} onChange={handleInputChange} placeholder={COIN_LABELS.coinapp.filterlabels[8]} aria-autocomplete="none" autoComplete="search-last-name" />
                            <RxMagnifyingGlass className="coinapp-input-search" onClick={() => requestNamesCompl('lastName')} />
                        </div>
                        <div className="coinapp-filter-dropdown__toggle" onClick={filterDropDownToggle}>
                            {
                                !filterDropDownIsOpen &&
                                <FaChevronDown className="coinapp-filter-dropdown__toggle-down" />
                            }
                            {
                                filterDropDownIsOpen &&
                                <FaChevronUp className="coinapp-filter-dropdown__toggle-up" />
                            }
                        </div>
                    </div>
                </div>
                <div className="coinapp-filter-footer">
                    <div className="coinapp-result-header">{ COIN_LABELS.coinapp.resultcountlabels[0] }{ totalHits } <span className="coinapp-small-font">(max 50) { COIN_LABELS.coinapp.resultcountlabels[1] }</span></div>
                </div>
            </form>

            {dataLocCompl && dataLocCompl.length > 0 &&
                <div className={`coinapp-result-loccompl-wrapper ${!filterDropDownIsOpen ? 'coinapp-result-loccompl-wrapper--dropdown--minimized' : ''}`}>
                    {locComplField == 'city' &&
                        <div className="coinapp-result-loccompl-wrapper--helper">
                            {dataLocCompl.map((loccomplval) => (
                                <div className="coinapp-result-loccompl" onClick={() => setLocComplVal(loccomplval.city)}>
                                    <span>{ COIN_LABELS.coinapp.loccomplcitylabels[0] }{ loccomplval.city }</span>
                                    <span className="rightlane-ismax">{ COIN_LABELS.coinapp.loccomplcitylabels[1] }{ loccomplval.municipality }</span>
                                    <span>{ COIN_LABELS.coinapp.loccomplcitylabels[2] }{ loccomplval.province }</span>
                                </div>
                            ))}
                        </div>
                    }
                    {locComplField == 'street' &&
                    <div className="coinapp-result-loccompl-wrapper--helper">
                        {dataLocCompl.map((loccomplval) => (
                            <div className="coinapp-result-loccompl" onClick={() => setLocComplVal(loccomplval.street)}>
                                <span>{ COIN_LABELS.coinapp.loccomplstreetlabels[0] }{ loccomplval.street }</span>
                                <span>{ COIN_LABELS.coinapp.loccomplstreetlabels[1] }{ loccomplval.city }</span>
                                <span className="rightlane-ismax">{ COIN_LABELS.coinapp.loccomplstreetlabels[2] }{ loccomplval.municipality }</span>
                                <span className="rightlane-ismax">{ COIN_LABELS.coinapp.loccomplstreetlabels[3] }{ loccomplval.province }</span>
                            </div>
                        ))}
                    </div>
                    }
                </div>
            }

            {dataNamesCompl && dataNamesCompl.length > 0 &&
                <div className={`coinapp-result-namescompl-wrapper ${!filterDropDownIsOpen ? 'coinapp-result-namescompl-wrapper--dropdown--minimized' : ''}`}>
                    <div className="coinapp-result-namescompl-wrapper--helper">
                        {
                            dataNamesCompl.map((namescomplval: string) => (
                                <div className="coinapp-result-namescompl" onClick={() => setNamesComplVal(namescomplval)}>{ namescomplval }</div>
                            ))
                        };
                    </div>
                </div>
            }

            {data && data.length > 0 &&
                <div className="coinapp-result-column-header">
                    <span className="coinapp-result-column-header__title">{ COIN_LABELS.coinapp.resultheaderlabels[0] }</span>
                    <span className="coinapp-result-column-header__title">{ COIN_LABELS.coinapp.resultheaderlabels[1] }</span>
                    <span className="coinapp-result-column-header__title rightlane-ismax">{ COIN_LABELS.coinapp.resultheaderlabels[2] }</span>
                    <span className="coinapp-result-column-header__title rightlane-ismax" style={{maxWidth:'60px'}}>{ COIN_LABELS.coinapp.resultheaderlabels[3] }</span>
                    <span className="coinapp-result-column-header__title rightlane-ismax" style={{maxWidth:'80px'}}>{ COIN_LABELS.coinapp.resultheaderlabels[4] }</span>
                    <span className="coinapp-result-column-header__title">{ COIN_LABELS.coinapp.resultheaderlabels[5] }</span>
                </div>
            }

            {data && data.length > 0 &&
                <div className={`coinapp-data-wrapper ${!filterDropDownIsOpen ? 'coinapp-data-wrapper--dropdown--minimized' : ''}`}>
                    <div className="coinapp-data-wrapper--helper">
                        {data.map((row:any, index) => (
                            <div className="coinapp-data-row" key={row.id}>
                                <span className="coinapp-data-row__value">{ checkCompanyName(row) }</span>
                                <span className="coinapp-copytoclipboard" onClick={(event) => handleCopyToClipboard(event, index)}>
                                    <FaRedo className="coinapp-transfer--js" />
                                    <input type="text" id={`coinapp-copytoclipboard-input${index}`} className="coinapp-copytoclipboard-input coinapp-transfer--js" defaultValue={row.phoneNumber} aria-autocomplete="none" autoComplete="off" />
                                    <FaCopy className="coinapp-copy--js" />
                                    <span data-coinapp-transfertooltip={index} className="coinapp-copytooltip">Transfer + Copied</span>
                                    <span data-coinapp-copytooltip={index} className="coinapp-copytooltip">Copied</span>
                                </span>
                                <span className="coinapp-data-row__value rightlane-ismax">{ row.street }</span>
                                <span className="coinapp-data-row__value rightlane-ismax" style={{maxWidth:'60px'}}>{ row.houseNumber } { row.houseNumberAddition }</span>
                                <span className="coinapp-data-row__value rightlane-ismax" style={{maxWidth:'80px'}}>{ row.postcode }</span>
                                <span className="coinapp-data-row__value">{ row.city }</span>
                            </div>
                        ))};
                    </div>
                </div>
            }

            {
                code !== '' || errordescription !== '' &&
                <div className="errorField">
                    <span>
                        { code }
                    </span>
                    <span>&nbsp;</span>
                    {
                        errordescription !== '' &&
                        <span>
                            { errordescription }
                        </span>
                    }
                </div>
            }

        </section>
    );
}

export default CoinApp;
