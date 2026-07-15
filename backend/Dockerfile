FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ShyamAgroSuite.Api.csproj", "./"]
RUN dotnet restore "ShyamAgroSuite.Api.csproj"
COPY . .
RUN dotnet publish "ShyamAgroSuite.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "ShyamAgroSuite.Api.dll"]
