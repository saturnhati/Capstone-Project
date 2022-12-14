import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Obj } from '@popperjs/core';
import { AuthData, AuthService } from 'src/app/auth/auth.service';
import { Pkmn } from 'src/app/_models/pkmn.interface';
import { Team } from 'src/app/_models/team.interface';
import { PokemonService } from '../pokemon.service';

@Component({
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
})
export class TeamsPage implements OnInit {
  @ViewChild('f') form!: NgForm;
  loggedUser!: AuthData | null;
  teams!: Team[] | undefined;
  userTeams!: Team[] | undefined;
  userPokemons!: Obj;

  constructor(
    private authService: AuthService,
    private pokemonService: PokemonService
  ) {}

  ngOnInit(): void {
    this.getLoggedUserData();
    this.getUserTeamsAndPokemons();
  }

  getLoggedUserData() {
    this.loggedUser = this.authService.getIsLogged();
  }

  getUserTeamsAndPokemons() {
    this.pokemonService.getTeams().subscribe((data) => {
      this.teams = data;
      this.userTeams = this.teams.filter(
        (team) => team.trainer === this.loggedUser?.user.id
      );
      this.getUserPokemons();
    });
  }

  getUserPokemons() {
    this.userPokemons = new Object();
    if (this.userTeams === undefined || this.userTeams.length === 0) {
      return;
    }
    this.pokemonService.getUserPokemons().subscribe((data) => {
      this.teams?.forEach((team) => {
        this.userPokemons[`${team.id}`] = data.filter((pokemon) => {
          return pokemon.team === team.id;
        });
      });
    });
  }

  addTeam() {
    if (this.loggedUser?.user.id !== undefined) {
      let newTeam: Team = this.form.value;
      newTeam.trainer = this.loggedUser.user.id;
      newTeam.size = 0;
      newTeam.id = crypto.randomUUID();
      this.pokemonService.addTeam(newTeam).subscribe((data) => {
        console.log('Team created!');
        this.form.reset();
        this.getUserTeamsAndPokemons();
      });
    }
  }

  removeTeam(obj: Team) {
    let thisTeam: Pkmn[];
    this.pokemonService.getUserPokemons().subscribe((data) => {
      thisTeam = data.filter((pokemon) => pokemon.team == obj.id);
      console.log(thisTeam);
      thisTeam.forEach((pokemon) => {
        this.pokemonService
          .removePokemon(pokemon)
          .subscribe((data) => console.log('Removed pokemon'));
      });
    });
    if (obj.id !== undefined) {
      this.pokemonService
        .removeTeam(obj.id)
        .subscribe((data) => console.log('Team removed!'));
    }
    let i: number | undefined = this.userTeams?.indexOf(obj);
    if (i !== undefined) {
      this.userTeams?.splice(i, 1);
    }
  }

  removePokemon(obj: Pkmn) {
    this.pokemonService.removePokemon(obj).subscribe((data) => {
      console.log('Pokemon removed');
      if (obj.team !== undefined) {
        this.decreaseTeamSize(obj.team);
      }
      this.getUserTeamsAndPokemons();
    });
  }

  decreaseTeamSize(team_id: string) {
    this.pokemonService.getTeam(team_id).subscribe((data) => {
      this.pokemonService
        .updateTeam({ size: --data.size }, team_id)
        .subscribe((data) => console.log(data.size));
    });
  }
}
