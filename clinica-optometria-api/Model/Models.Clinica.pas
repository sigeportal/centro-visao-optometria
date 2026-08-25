unit Models.Clinica;

interface

uses
  UnitPaciente.Model,
  UnitAgendamento.Model,
  UnitConsulta.Model,
  UnitAnamnese.Model,
  UnitPrescricao.Model,
  UnitFichaSecao.Model,
  UnitFichaClinicaDados.Model,
  UnitFinanceiroLancamento.Model,
  UnitDocumentoConsulta.Model,
  UnitRetornoConsulta.Model;

type
  TModelPaciente = UnitPaciente.Model.TModelPaciente;
  TModelAgendamento = UnitAgendamento.Model.TModelAgendamento;
  TModelConsulta = UnitConsulta.Model.TModelConsulta;
  TModelAnamnese = UnitAnamnese.Model.TModelAnamnese;
  TModelPrescricao = UnitPrescricao.Model.TModelPrescricao;
  TModelFichaSecao = UnitFichaSecao.Model.TModelFichaSecao;
  TModelFichaClinicaDados = UnitFichaClinicaDados.Model.TModelFichaClinicaDados;
  TModelFinanceiroLancamento = UnitFinanceiroLancamento.Model.TModelFinanceiroLancamento;
  TModelDocumentoConsulta = UnitDocumentoConsulta.Model.TModelDocumentoConsulta;
  TModelRetornoConsulta = UnitRetornoConsulta.Model.TModelRetornoConsulta;

implementation

end.
