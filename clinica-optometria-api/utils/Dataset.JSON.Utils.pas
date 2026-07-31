unit Dataset.JSON.Utils;

interface

uses
	System.SysUtils,
  System.JSON,
  Data.DB;

type
  TDatasetJsonUtils = class
  public
    class function QueryToJSONArray(ADataSet: TDataSet): TJSONArray;
  end;

implementation

class function TDatasetJsonUtils.QueryToJSONArray(ADataSet: TDataSet): TJSONArray;
var
  LItem: TJSONObject;
  I: Integer;
  LField: TField;
begin
  Result := TJSONArray.Create;

  ADataSet.First;
  while not ADataSet.Eof do
  begin
    LItem := TJSONObject.Create;
    for I := 0 to ADataSet.Fields.Count - 1 do
    begin
      LField := ADataSet.Fields[I];
      if LField.IsNull then
        LItem.AddPair(LowerCase(LField.FieldName), TJSONNull.Create)
      else
        LItem.AddPair(LowerCase(LField.FieldName), LField.AsString);
    end;
    Result.Add(LItem);
    ADataSet.Next;
  end;
end;

end.
