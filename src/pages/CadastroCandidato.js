import { Formik, Field, Form, FieldArray } from "formik";
import styles from "../styles/CadastroCandidato.module.css";
import api from "../api";
import { useState } from "react";
import * as Yup from 'yup'
import { ErrorMessage } from "formik";
import ReactInputMask from "react-input-mask";
import moment from "moment";
import { useContext } from "react";
import { CandidatosContext } from "../context/CandidatosContext";

const CadastroCandidato = () => {
  const {editCandidato,editMode,setEditMode} = useContext(CandidatosContext)
  const [disabledFieldsSchool,setDisabledFieldsSchool] = useState([])
  const [disabledFieldsExp,setDisabledFieldsExp] = useState([])
  const [fileInputValue,setFileInputValue] = useState("")
  console.log(editCandidato)
  const initialValues = editMode 
  ? 
  {
    nome: editCandidato.candidato.nome,
    cpf: editCandidato.candidato.cpf,
    dataNascimento: editCandidato.candidato.dataNascimento,
    rua: editCandidato.candidato.logradouro,
    cargo: editCandidato.candidato.cargo,
    senioridade: editCandidato.candidato.senioridade,
    dadosEscolares: editCandidato.dadosEscolares,
    experiencias: editCandidato.experiencias,
    curriculo: "",
    complemento: editCandidato.candidato.complemento,
    numero: editCandidato.candidato.numero,
    telefone: editCandidato.candidato.telefone,
  } 
  : 
  {
    nome: "",
    cpf: "",
    dataNascimento: "",
    rua: "",
    cargo: "",
    senioridade: "",
    dadosEscolares: [],
    experiencias: [],
    curriculo: "",
    complemento: "",
    numero: "",
    telefone: "",
  }

  const changeFile = (e,setFieldValue) =>{
    setFieldValue("curriculo", e.target.files[0]);
    setFileInputValue(e.name)
  }

  const removeCPFMask = (value) =>{
    return value.replaceAll("-","").replaceAll(".","").replaceAll("_","")
  }

  const formatDateRaw = (value) =>{
    return value.replaceAll('_','').replaceAll('/','')
  }

  const formatDateToApi = (value) =>{
    return moment(value, 'DD/MM/YYYY', true).format('YYYY-MM-DD')
  }

  const validateDate = (value) => {
    let today = moment()
    let formatedDate = moment(value, 'DDMMYYYY', true).format('YYYY-MM-DD')
    return (moment(formatedDate).isValid() && today.diff(moment(value, 'DDMMYYYY'), 'days') > 0 && today.diff(moment(value, 'DDMMYYYY'), 'years') < 110)
  }

  const isAgeEnough = (value) =>{
    let today = moment()
    return today.diff(moment(value, 'DDMMYYYY'), 'years') >= 16
  }

  const removePhoneMask = (value) => {
    return value.replaceAll(' ','').replaceAll('(','').replaceAll(')','').replaceAll('-','').replaceAll('_','')
  }

  const postCandidato = async (values) => {
    const candidatoCreateDTO = {
      cargo: values.cargo,
      complemento: values.complemento,
      cpf: removeCPFMask(values.cpf),
      dataNascimento: formatDateToApi(values.dataNascimento),
      logradouro: values.rua,
      nome: values.nome,
      numero: Number(values.numero),
      senioridade: values.senioridade,
      telefone: values.telefone,
    };
    try {
      const { data } = await api.post("/candidato", candidatoCreateDTO);
      return data.idCandidato;
    } catch (error) {
      if(error.response.data.message == 'CPF já cadastrado'){
        alert('O CPF inserido já existe em nosso sistema')
      }
    }
  };

  const postCurriculo = async (values, idCandidato) => {
    const formData = new FormData();
    formData.append("file", values.curriculo);
    await api.post(`/curriculo/upload-curriculo/${idCandidato}`, formData);
  };

  const postExperiencia = async (values, idCandidato) => {
    values.experiencias.map(async (experiencia) => {
      let experienciaDTO = {
        dataFim: experiencia.dataFim == "" ? null : new Date(formatDateToApi(experiencia.dataFim)),
        dataInicio: new Date(formatDateToApi(experiencia.dataInicio)),
        descricao: experiencia.descricao,
        nomeEmpresa: experiencia.nomeEmpresa,
      };
      await api.post(
        `/experiencias?idCandidato=${idCandidato}`,
        experienciaDTO
      );
    });
  };

  const postDadosEscolares = async (values, idCandidato) => {
    values.dadosEscolares.map(async (dados) => {
      let dadosEscolaresDTO = {
        dataFim: dados.dataFim == "" ? null : new Date(formatDateToApi(dados.dataFim)),
        dataInicio: new Date(formatDateToApi(dados.dataInicio)),
        descricao: dados.descricao,
        instituicao: dados.instituicao,
      };
      await api.post(
        `/dados-escolares?idCandidato=${idCandidato}`,
        dadosEscolaresDTO
      );
    });
  };

  const putCandidato = async (values,idCandidato) =>{
    console.log(values)
    const candidatoCreateDTO = {
      cargo: values.cargo,
      complemento: values.complemento,
      cpf: removeCPFMask(values.cpf),
      dataNascimento: formatDateToApi(values.dataNascimento),
      logradouro: values.rua,
      nome: values.nome,
      numero: Number(values.numero),
      senioridade: values.senioridade,
      telefone: values.telefone,
    };
    await api.put(`/candidato?idCandidato=${idCandidato}`,candidatoCreateDTO)
  }

  const putDadosEscolares = async (values,idCandidato) =>{
    editCandidato.dadosEscolares.map(async (dadoEscolar)=>{
      await api.delete(`/dados-escolares?idDadosEscolares=${dadoEscolar.idDadosEscolares}`)
    })
    values.dadosEscolares.map(async (dadoEscolarNovo)=>{
      let dadosEscolaresDTO = {
        dataFim: dadoEscolarNovo.dataFim == "" ? null : new Date(formatDateToApi(dadoEscolarNovo.dataFim)),
        dataInicio: new Date(formatDateToApi(dadoEscolarNovo.dataInicio)),
        descricao: dadoEscolarNovo.descricao,
        instituicao: dadoEscolarNovo.instituicao,
      };
      await api.post(
        `/dados-escolares?idCandidato=${idCandidato}`,
        dadosEscolaresDTO
      );
    })
  }

  const putExperiencias = async (values,idCandidato) =>{
    console.log(values)
    editCandidato.experiencias.map(async (experiencia)=>{
      await api.delete(`/experiencias?idExperiencia=${experiencia.idExperiencia}`)
    })
    values.experiencias.map(async (experienciaNova)=>{
      let experienciaDTO = {
        dataFim: experienciaNova.dataFim == "" ? null : new Date(formatDateToApi(experienciaNova.dataFim)),
        dataInicio: new Date(formatDateToApi(experienciaNova.dataInicio)),
        descricao: experienciaNova.descricao,
        nomeEmpresa: experienciaNova.nomeEmpresa,
      };
      await api.post(
        `/experiencias?idCandidato=${idCandidato}`,
        experienciaDTO
      );
    })
  }

  const putCurriculo = async(values,idCandidato) =>{
    if(fileInputValue != ""){
      const formData = new FormData();
      formData.append("file", values.curriculo);
      await api.post(`/curriculo/upload-curriculo/${idCandidato}`, formData);
    }
  }

  const SignupSchema = Yup.object().shape({
    nome: Yup.string().required('Campo Obrigatório'),
    cargo: Yup.string().required('Campo Obrigatório'),
    complemento: Yup.string().required('Campo Obrigatório'),
    cpf: Yup.string().transform(value => {
      return removeCPFMask(value)
    }).required('Campo Obrigatório').length(11,'CPF deve conter 11 números'),
    dataNascimento: Yup.string().transform(value => {
      return formatDateRaw(value)
    }).required('Campo Obrigatório').length(8,'Digite a data completa').test("data-valida","Digite uma data válida",validateDate).test("idade-suficiente","O candidato deve ter ao menos 16 anos",isAgeEnough),
    rua: Yup.string().required('Campo Obrigatório'),
    nome: Yup.string().required('Campo Obrigatório'),
    numero: Yup.string().required('Campo Obrigatório'),
    senioridade: Yup.string().required('Campo Obrigatório'),
    telefone: Yup.string().transform(value => removePhoneMask(value)).required('Campo Obrigatório').length(11,'Digite seu telefone celular completo'),
    experiencias: Yup.array()
    .of(Yup.object().shape({
      nomeEmpresa: Yup.string().required('Campo Obrigatório'),
      dataInicio: Yup.string().transform(value => {
        return formatDateRaw(value)
      }).required('Campo Obrigatório').length(8,'Digite a data completa').test("data-valida","Digite uma data válida",validateDate).test("data-futura-nascimento","Sua data de início é passado ao seu nascimento",function(v){
        let dataNascimento = formatDateRaw(this.from[1].value.dataNascimento)
        return moment(v,'DDMMYYYY',true) > moment(dataNascimento,'DDMMYYYY',true)   
      }),
      dataFim: Yup.string().when("atualmente",{
        is: (val) => val == false,
        then: Yup.string().transform(value => {
          return formatDateRaw(value)
        }).required('Campo Obrigatório').length(8,'Digite a data completa').test("data-valida","Digite uma data válida",validateDate).test("data-futura","Não pode ser uma data antes do início",function(v){
          return moment(v,'DDMMYYYY',true) > moment(this.parent.dataInicio,'DDMMYYYY',true)
        }),
        otherwise: Yup.string().notRequired()
      }),
      descricao: Yup.string().required('Campo Obrigatório'),
    })),
    dadosEscolares: Yup.array()
    .of(Yup.object().shape({
      instituicao: Yup.string().required('Campo Obrigatório'),
      dataInicio: Yup.string().transform(value => {
        return formatDateRaw(value)
      }).required('Campo Obrigatório').length(8,'Digite a data completa').test("data-valida","Digite uma data válida",validateDate).test("data-futura-nascimento","Sua data de início é passado ao seu nascimento",function(v){
        let dataNascimento = formatDateRaw(this.from[1].value.dataNascimento)
        return moment(v,'DDMMYYYY',true) > moment(dataNascimento,'DDMMYYYY',true)   
      }),
      descricao: Yup.string().required('Campo Obrigatório'),
      dataFim: Yup.string().when("atualmente",{
        is: (val) => val == false,
        then: Yup.string().transform(value => {
          return formatDateRaw(value)
        }).required('Campo Obrigatório').length(8,'Digite a data completa').test("data-valida","Digite uma data válida",validateDate).test("data-futura","Não pode ser uma data antes do início",function(v){
          return moment(v,'DDMMYYYY',true) > moment(this.parent.dataInicio,'DDMMYYYY',true)
        }),
        otherwise: Yup.string().notRequired()
      }),
    })),
    curriculo: !editMode ? Yup.mixed().required('É necessário seu currículo') : Yup.mixed().notRequired()
  });

  return (
    <div className={styles.cadastroContainer}>
      <Formik
        validationSchema={SignupSchema}
        initialValues={initialValues}
        onSubmit={async (values, { resetForm }) => {
          if(!editMode){
            let idCandidato = await postCandidato(values);
            await postCurriculo(values, idCandidato);
            await postExperiencia(values, idCandidato);
            await postDadosEscolares(values, idCandidato);
            alert("Candidato cadastrado com sucesso");
          } else{
            let idCandidato = editCandidato.candidato.idCandidato
            await putCandidato(values,idCandidato)
            await putExperiencias(values,idCandidato)
            await putDadosEscolares(values,idCandidato)
            await putCurriculo(values,idCandidato)
            setEditMode(false)
            alert(`Edição Completa`)
          }
          setDisabledFieldsSchool([])
          setDisabledFieldsExp([])
          resetForm();
          setFileInputValue("")
        }}
        enableReinitialize={true}
      >
        {({ values, setFieldValue, touched, errors }) => (
          <Form>
            <div className={styles.formDiv}>
              <h1 className={styles.cadastroTitulo}>{editMode ? "Edição de Candidato" : "Cadastro de Candidatos"}</h1>
              <div className={styles.fieldDiv}>
                <label htmlFor="nome">Nome</label>
                <Field id="nome" name="nome" placeholder="Digite seu nome" />
                {errors.nome && touched.nome && <p className={styles.errors}>{errors.nome}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="cpf">CPF</label>
                <Field id="cpf" name="cpf" render={({field})=>(
                  <ReactInputMask {...field} placeholder="Digite seu CPF" mask={'999.999.999-99'} />
                )} />
                {errors.cpf && touched.cpf && <p className={styles.errors}>{errors.cpf}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="dataNascimento">Data de Nascimento</label>
                <Field
                  id="dataNascimento"
                  name="dataNascimento"
                  render={({field})=>(
                    <ReactInputMask {...field} placeholder="Digite sua data de nascimento" mask={'99/99/9999'} />
                  )}
                />
                {errors.dataNascimento && touched.dataNascimento && <p className={styles.errors}>{errors.dataNascimento}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="telefone">Telefone</label>
                <Field
                  id="telefone"
                  name="telefone"
                  render={({field})=>(
                    <ReactInputMask {...field} placeholder="Digite seu telefone" mask={'(99) 99999-9999'} />
                  )}
                />
                {errors.telefone && touched.telefone && <p className={styles.errors}>{errors.telefone}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="rua">Rua</label>
                <Field id="rua" name="rua" placeholder="Digite sua rua" />
                {errors.rua && touched.rua && <p className={styles.errors}>{errors.rua}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="complemento">Complemento</label>
                <Field
                  id="complemento"
                  name="complemento"
                  placeholder="Digite o complemento"
                />
                {errors.complemento && touched.complemento && <p className={styles.errors}>{errors.complemento}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="numero">Número</label>
                <Field
                  id="numero"
                  name="numero"
                  placeholder="Digite o numero"
                  type="number"
                />
                {errors.numero && touched.numero && <p className={styles.errors}>{errors.numero}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="cargo">Cargo</label>
                <Field id="cargo" name="cargo" placeholder="Digite seu cargo" />
                {errors.cargo && touched.cargo && <p className={styles.errors}>{errors.cargo}</p>}
              </div>

              <div className={styles.fieldDiv}>
                <label htmlFor="senioridade">Senioridade</label>
                <Field
                  id="senioridade"
                  name="senioridade"
                  placeholder="Digite sua senioridade"
                />
                {errors.senioridade && touched.senioridade && <p className={styles.errors}>{errors.senioridade}</p>}
              </div>
              <div className={styles.fieldDiv}>
                <label htmlFor="dadosEscolares">Dados Escolares</label>
                <FieldArray
                  name="dadosEscolares"
                  render={(arrayHelpers) => (
                    <div>
                      {values.dadosEscolares.map((dadosEscolares, index) => (
                        <div className={styles.arrayDiv} key={index}>
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`dadosEscolares[${index}].instituicao`}
                            >
                              Instituição
                            </label>
                            <Field
                              placeholder="Instituição"
                              name={`dadosEscolares[${index}].instituicao`}
                            />
                            <ErrorMessage name={`dadosEscolares[${index}].instituicao`} render={msg => <p className={styles.errors}>{msg}</p>} />         
                          </div>

                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`dadosEscolares.${index}.descricao`}
                            >
                              Descrição
                            </label>
                            <Field
                              placeholder="Descrição"
                              name={`dadosEscolares.${index}.descricao`}
                            />
                            <ErrorMessage name={`dadosEscolares[${index}].descricao`} render={msg => <p className={styles.errors}>{msg}</p>} />                                 
                          </div>
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`dadosEscolares.${index}.dataInicio`}
                            >
                              Data Início
                            </label>
                            <Field
                              name={`dadosEscolares.${index}.dataInicio`}
                              render={({field})=>(
                                <ReactInputMask {...field} placeholder="Data início" mask={'99/99/9999'} />
                              )}
                            />
                            <ErrorMessage name={`dadosEscolares[${index}].dataInicio`} render={msg => <p className={styles.errors}>{msg}</p>} />                                 
                          </div>
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`dadosEscolares.${index}.dataFim`}
                            >
                              Data Fim
                            </label>
                            <Field
                              name={`dadosEscolares.${index}.dataFim`}
                              id={`dadosEscolares.${index}.dataFim`}
                              render={({field})=>(
                                <ReactInputMask {...field} disabled={disabledFieldsSchool.some(value => value == index)} placeholder="Data Fim" mask={disabledFieldsSchool.some(value => value == index) ? "" : "99/99/9999"} />
                              )}
                            />
                            <ErrorMessage name={`dadosEscolares[${index}].dataFim`} render={msg => <p className={styles.errors}>{msg}</p>} />  
                            <label
                              className={styles.subLabels}
                              htmlFor={`dadosEscolares.${index}.atualmente`}
                            >
                              Atualmente?
                            </label>
                            <Field
                              value="atualmente"
                              type="checkbox"
                              name={`dadosEscolares.${index}.atualmente`}
                              onClick={()=>{
                                setFieldValue(`dadosEscolares.${index}.dataFim`,"")
                                if(disabledFieldsSchool.some(value => value == index)){
                                  const position = disabledFieldsSchool.indexOf(index)
                                  disabledFieldsSchool.splice(position,1)
                                } else{
                                  setDisabledFieldsSchool([...disabledFieldsSchool,index])
                                }                               
                              }}
                            />
                          </div>

                          <button
                            className={styles.arrayButtons}
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                          >
                            -
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.arrayButtonsAdd}
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({
                            instituicao: "",
                            descricao: "",
                            dataInicio: "",
                            dataFim: "",
                            atualmente: 0
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                />
              </div>
              <div className={styles.fieldDiv}>
                <label htmlFor="dadosEscolares">Experiências</label>
                <FieldArray
                  name="experiencias"
                  render={(arrayHelpers) => (
                    <div>
                      {values.experiencias.map((experiencias, index) => (
                        <div className={styles.arrayDiv} key={index}>
                          {/** both these conventions do the same */}
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`experiencias[${index}].nomeEmpresa`}
                            >
                              Nome da Empresa
                            </label>
                            <Field
                              placeholder="Nome da Empresa"
                              name={`experiencias[${index}].nomeEmpresa`}
                            />
                            <ErrorMessage name={`experiencias[${index}].nomeEmpresa`} render={msg => <p className={styles.errors}>{msg}</p>} />
                          </div>

                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`experiencias.${index}.descricao`}
                            >
                              Descrição
                            </label>
                            <Field
                              placeholder="Descrição"
                              name={`experiencias.${index}.descricao`}
                            />
                            <ErrorMessage name={`experiencias[${index}].descricao`} render={msg => <p className={styles.errors}>{msg}</p>} />
                          </div>
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`experiencias.${index}.dataInicio`}
                            >
                              Data Início
                            </label>
                            <Field
                              name={`experiencias.${index}.dataInicio`}
                              render={({field})=>(
                                <ReactInputMask {...field} placeholder="Data início" mask={'99/99/9999'} />
                              )}
                            />
                            <ErrorMessage name={`experiencias[${index}].dataInicio`} render={msg => <p className={styles.errors}>{msg}</p>} />
                          </div>
                          <div className={styles.fieldDiv}>
                            <label
                              className={styles.subLabels}
                              htmlFor={`experiencias.${index}.dataFim`}
                            >
                              Data Fim
                            </label>
                            <Field
                              name={`experiencias.${index}.dataFim`}
                              render={({field})=>(
                                <ReactInputMask {...field} disabled={disabledFieldsExp.some(value => value == index)} placeholder="Data Fim" mask={disabledFieldsExp.some(value => value == index) ? "" : "99/99/9999"} />
                              )}
                            />
                            <ErrorMessage name={`experiencias[${index}].dataFim`} render={msg => <p className={styles.errors}>{msg}</p>} />
                            <label
                              className={styles.subLabels}
                              htmlFor={`experiencias.${index}.atualmente`}
                            >
                              Atualmente?
                            </label>
                            <Field
                              value="atualmente"
                              type="checkbox"
                              name={`experiencias.${index}.atualmente`}
                              onClick={()=>{
                                setFieldValue(`experiencias.${index}.dataFim`,"")
                                if(disabledFieldsExp.some(value => value == index)){
                                  const position = disabledFieldsExp.indexOf(index)
                                  disabledFieldsExp.splice(position,1)
                                } else{
                                  setDisabledFieldsExp([...disabledFieldsExp,index])
                                }                               
                              }}
                            />
                          </div>

                          <button
                            className={styles.arrayButtons}
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                          >
                            -
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.arrayButtonsAdd}
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({
                            nomeEmpresa: "",
                            descricao: "",
                            dataInicio: "",
                            dataFim: "",
                            atualmente: 0
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                />
              </div>
              <div className={styles.fieldDiv}>
                <label htmlFor="curriculo">{!editMode ? `Faça o upload do seu currículo` : `Deixe vazio caso não queira alterar o currículo`}</label>
                <input
                  type="file"
                  id="curriculo"
                  name="curriculo"
                  placeholder="Upload do seu currículo"
                  value={fileInputValue}
                  onChange={(e) => {
                    changeFile(e,setFieldValue)
                  }}
                />
                {errors.curriculo && touched.curriculo && <p className={styles.errors}>{errors.curriculo}</p>}
              </div>
              <button className={styles.submitButton} type="submit">
                {editMode ? "Editar Candidato" : "Registrar Candidato"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CadastroCandidato;
