namespace $ {
	
	export const $giper_player_api_search_movie_data = $mol_data_array( $mol_data_record({
		id: $mol_data_integer,
		year: $mol_data_pipe( $mol_data_string, Number ),
		poster: $mol_data_string,
		raw_data: $mol_data_record({
			name_en: $mol_data_nullable( $mol_data_string ),
			name_ru: $mol_data_nullable( $mol_data_string ),
			description: $mol_data_nullable( $mol_data_string ),
			genres: $mol_data_array( $mol_data_record({
				genre: $mol_data_string,
			}) )
		})
	}) )
	
	export const $giper_player_api_movie_data_short = $mol_data_record({
		name_original: $mol_data_nullable( $mol_data_string ),
		name_en: $mol_data_nullable( $mol_data_string ),
		name_ru: $mol_data_nullable( $mol_data_string ),
		poster_url_preview: $mol_data_string,
	})
	
	export const $giper_player_api_similar_data = $mol_data_record({
		... $giper_player_api_movie_data_short.config,
		film_id: $mol_data_integer,
	})
	
	export const $giper_player_api_member = $mol_data_record({
		description: $mol_data_nullable( $mol_data_string ),
		name_en: $mol_data_string,
		name_ru: $mol_data_string,
		poster_url: $mol_data_string,
		profession_key: $mol_data_string,
		profession_text: $mol_data_string,
		staff_id: $mol_data_integer,
	})
	
	export const $giper_player_api_movie_data_full = $mol_data_record({
		... $giper_player_api_movie_data_short.config,
		imdb_id: $mol_data_nullable( $mol_data_string ),
		year: $mol_data_integer,
		description: $mol_data_nullable( $mol_data_string ),
		slogan: $mol_data_nullable( $mol_data_string ),
		genres: $mol_data_array( $mol_data_record({
			genre: $mol_data_string,
		}) ),
		sequels_and_prequels: $mol_data_array( $giper_player_api_similar_data ),
		similars: $mol_data_array( $giper_player_api_similar_data ),
		staff: $mol_data_array( $giper_player_api_member ),
	})
	
	export const $giper_player_api_player_data = $mol_data_record({
		data: $mol_data_array( $mol_data_record({
			type: $mol_data_string,
			iframeUrl: $mol_data_nullable( $mol_data_string ),
		}) )
	})
	
	export class $giper_player_api extends $mol_object {
		
		@ $mol_mem_key
		static search( query: string ): Map< number, $giper_player_api_movie > {
			
			if( !query.trim() ) return new Map
			
			const resp = $giper_player_api_search_movie_data(
				this.$.$mol_fetch.json( `https://api4.rhserv.vu/search/${ encodeURIComponent( query ) }` ) as any[]
			)
			
			return new Map(
				resp.map( data => [ data.id, $giper_player_api_movie.make({
					id: $mol_const( data.id ),
					title: $mol_const( data.raw_data.name_ru || data.raw_data.name_en || `#${data.id}` ),
					poster: $mol_const( data.poster ),
					year: $mol_const( data.year ),
					descr: $mol_const( data.raw_data.description ?? '' ),
					genres: $mol_const( data.raw_data.genres.map( g => g.genre ) ),
				}) ] )
			)
			
		}
		
	}
	
	export class $giper_player_api_movie extends $mol_object {
		
		id() {
			return 0
		}
		
		uri_kp() {
			return `https://kinopoisk.ru/film/${ this.id() }/`
		}
		
		uri_imdb() {
			return this.data().imdb_id && `https://imdb.com/title/${ this.data().imdb_id }/`
		}
		
		@ $mol_mem
		data() {
			return $giper_player_api_movie_data_full(
				this.$.$mol_fetch.json( `https://api4.rhserv.vu/kp_info2/${ this.id() }` )  as any
			) 
		}
		
		title() {
			return this.data().name_ru || this.data().name_en || this.data().name_original || '???'
		}
		
		year() {
			return this.data().year
		}
		
		poster() {
			return this.data().poster_url_preview
		}
		
		descr() {
			return this.data().description ?? ''
		}
		
		slogan() {
			return this.data().slogan ?? ''
		}
		
		@ $mol_mem
		genres() {
			return this.data().genres.map( g => g.genre )
		}
		
		@ $mol_mem
		similars() {
			return new Map(
				[ ... this.data().sequels_and_prequels, ... this.data().similars ]
				.map( sim => [ sim.film_id, $giper_player_api_movie.make({
					id: $mol_const( sim.film_id ),
					title: $mol_const( sim.name_ru || sim.name_en || sim.name_original || '???' ),
					poster: $mol_const( sim.poster_url_preview ),
				}) ] )
			)
		}
		
		@ $mol_mem
		members() {
			const members = $mol_array_groups( this.data().staff, item => ' ' + item.staff_id )
			return new Map(
				[ ... Object.entries( members ) ].map( ([ id, items ])=> [
					parseInt( id ),
					items!.reduce( ( res, item )=> {
						res.name = item.name_ru || item.name_en || res.name
						res.photo = item.poster_url || res.photo
						if( item.profession_key ) {
							const prof = item.profession_key.toLowerCase()
							res.roles.add( item.description ? `${prof} (${ item.description })` : prof )
						}
						return res
					}, {
						name: 'Anonymous',
						photo: 'about:blank',
						link: `https://www.kinopoisk.ru/name/${ parseInt( id ) }/`,
						roles: new Set< string >(),
					} )
				] )
			)
		}
		
		@ $mol_mem
		players() {
			
			const resp = $giper_player_api_player_data(
				this.$.$mol_fetch.json( `https://fbphdplay.top/api/players?kinopoisk=${ this.id() }` ) as any
			).data
			.filter( data => data.iframeUrl )
			.toSorted( $mol_compare_text( data => data.type ) )
			
			return new Map( resp.map( data => [ data.type, $giper_player_api_player.make({ data: $mol_const( data ) }) ] ) )
		}
		
	}
	
	export class $giper_player_api_player extends $mol_object {
		
		data() {
			return null as any as ( typeof $giper_player_api_player_data.Value.data )[ number ]
		}
		
		title() {
			return this.data().type
		}
		
		uri() {
			return this.data().iframeUrl
		}
		
	}
	
}
