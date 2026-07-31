unit Models.Clinica;

interface

uses
  UnitPaciente.Model,
  UnitAgendamento.Model,
  UnitConsulta.Model,
  UnitAnamnese.Model,
  UnitPrescricao.Model,
  UnitFichaSecao.Model,
  UnitFinanceiroLancamento.Model,
  UnitDocumentoConsulta.Model;

type
  TModelPaciente = UnitPaciente.Model.TModelPaciente;
  TModelAgendamento = UnitAgendamento.Model.TModelAgendamento;
  TModelConsulta = UnitConsulta.Model.TModelConsulta;
  TModelAnamnese = UnitAnamnese.Model.TModelAnamnese;
  TModelPrescricao = UnitPrescricao.Model.TModelPrescricao;
  TModelFichaSecao = UnitFichaSecao.Model.TModelFichaSecao;
  TModelFinanceiroLancamento = UnitFinanceiroLancamento.Model.TModelFinanceiroLancamento;
  TModelDocumentoConsulta = UnitDocumentoConsulta.Model.TModelDocumentoConsulta;

implementation

end.
