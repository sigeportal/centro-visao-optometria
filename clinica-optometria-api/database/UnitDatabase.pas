unit UnitDatabase;

interface

uses
  UnitConnection.Model.Interfaces;

type
  TDatabase = class
  public
    class function Connection: iConnection;
    class function Query: iQuery;
  end;

implementation

uses
  UnitConstants,
  UnitConnection.Firedac.Model,
  UnitFactory.Connection.Firedac;

class function TDatabase.Connection: iConnection;
begin
  Result := TConnectionFiredac.New(TConstants.BancoDados);
end;

class function TDatabase.Query: iQuery;
begin
  Result := TFactoryConnectionFiredac.New(TConstants.BancoDados).Query;
end;

end.
